# Messaging protocol

The client and the server communicate over a WebSocket. The client opens it at `/` on the origin that served the page (`ws://` for `http://`, `wss://` for `https://`).

Every message is a JSON object sent as a text frame:

```json
{"type": "<MESSAGE_TYPE>", "clearData": <payload>}
```

`type` is a value of `MESSAGE_TYPE` in [`shared/protocol.json`](../shared/protocol.json), and the shape of `clearData` depends on it. The client and the server both import their constants from that file; use them instead of string literals.

## Data types

| Name | Format |
|---|---|
| Direction | A value of `DIRECTION`: `"UP"`, `"RIGHT"`, `"DOWN"` or `"LEFT"` |
| Position | `{"x": <column>, "y": <row>}`, zero-based; `UP` decreases `y`. The map wraps around at its edges. |
| Map | An array of `mapSize` columns, each with `mapSize` values of `TERRAIN` (`0` path, `1` hole), indexed as `map[x][y]`, where `mapSize` is the one in the settings of the game. `mapSize`² · `holeRatio` / 100 squares, rounded down or up, are holes. |
| Game ID | An integer that identifies a game. Each new game has one that differs from all previous games since the server started. Clients only send it back in `MOVE`. |
| Settings | `{"mapSize": <integer>, "holeRatio": <integer>, "actors": <string>, "tiles": <string>, "maxPlayers": <integer>, "timeLimit": <integer>}` with every field of [`shared/settings.json`](../shared/settings.json), which defines the type, the allowed values and the default of each field. Ranges are inclusive and strings are case-sensitive. `mapSize`, `holeRatio`, `maxPlayers` and `timeLimit` affect the game on the server. `actors` and `tiles` don't affect it: they only choose the textures that every client draws for the game: `actors` the hero and the treasure, `tiles` the path and the holes. |
| Game | `{"map": <map>, "treasurePosition": <position>, "heroPosition": <position>, "gameId": <game ID>, "settings": <settings>, "remainingMs": <integer>}`, where `settings` are the ones the game was created with and `remainingMs` is the time left to the game in milliseconds at the moment the server sends it (see [Time limit](#time-limit)). The first game since the server started has the default settings. The `GAME` that a timeout starts has also the field `"timeout": true`; no other `GAME` has it, not even the one sent to a player who connects to that game. |

## Server → client

| `type` | `clearData` | Sent to | When |
|---|---|---|---|
| `GAME` | Game | All players | A new game starts: the first player connects, a turn ends the game (after `MOVES`), the server applies a valid `SETTINGS`, also in the middle of a turn and without `MOVES`, or the time limit of the game runs out (a timeout), also without `MOVES`. |
| `GAME` | Game | The connecting player | A player connects while a game is running and the server accepts them (see `REJECTED`). |
| `MOVES` | An array of directions in the order they arrived at the server | All players | A turn ends: the turn has as many moves as there are connected players, checked after every move and every disconnect. Moves of players who disconnected during the turn stay in the array and count, so a disconnect can end the turn before every connected player has moved. |
| `PLAYERS` | The number of connected players | All players | The server accepts a connecting player (after `GAME`), or a player disconnects. |
| `REJECTED` | `null` | The connecting client | A client connects while `maxPlayers` or more players are connected, where `maxPlayers` is the one in the current settings. The client gets no `GAME` or `PLAYERS`, and the server closes the connection with the close code `1000` (normal closure) and no reason, both in `CLOSE.REJECTED`. |

Clients apply `MOVES` in order and stop at the treasure or a hole, like the server does. After a turn that ends the game, the next message is `GAME` with a new game.

<a id="time-limit"></a>A game lasts `timeLimit` seconds from its start, where `timeLimit` is the one in the settings of that game. When the time runs out, the server starts a new game and broadcasts it as a `GAME` with `"timeout": true`. The time runs out when the timer of the server fires, which is later than `timeLimit` seconds after the start if the server is busy: it handles one event at a time, so a `MOVE` it handles before the timer fires belongs to the game, even if `timeLimit` seconds have passed, and the `MOVES` it causes precede the `GAME` with `timeout`. The field is only in this broadcast and is never `false`. The ended game gets no `MOVES`: the server discards the moves of the current turn, like for a valid `SETTINGS`, so every player can move in the new game, and a `MOVE` that arrives for the ended game is ignored (see [Validation](#validation)). Clients treat a `GAME` with `timeout` as if the hero stepped in a hole: the player loses a point, but not below 0, and the client shows the filter for a hole.

Every `GAME` carries `remainingMs`: the time left to the game at the moment the server sends it. It is `timeLimit` · 1000 in the broadcast of a new game and less in the `GAME` sent to a player who connects later. It is a duration, not a point in time, so it doesn't depend on the clocks of the server and the client: a client counts it from the moment it receives the `GAME`, and so it ends later than the server's countdown by the time the message was on the way. The server doesn't compensate for that, nor for the time a `MOVE` is on the way.

Every new game restarts the countdown: the first player connecting, the end of a game at the treasure or in a hole, a valid `SETTINGS`, even with the current settings, and a timeout. A turn that doesn't end the game doesn't, so the time is counted from the start of the game, not of the turn. The game that a `SETTINGS` starts has the `timeLimit` of those settings, so a changed `timeLimit` applies from that game. The countdown stops when the last player disconnects; the next player to connect starts a new game and its countdown.

Every new game has the current settings: the defaults until the server applies a valid `SETTINGS`, then the settings of the last `SETTINGS` it received, even after all players disconnect. Valid settings always start a new game, even when they equal the current ones. The server discards the moves of the current turn, so every player can move in the new game, and moves sent for the previous game are ignored (see [Validation](#validation)). Clients take the settings of each `GAME` as the current ones, so a client sends `SETTINGS` only with values that differ from the settings of the last game, even if another player applied them.

A rejected client doesn't count as a player: not in `PLAYERS` and not in a turn, and the server ignores its messages. Settings with a `maxPlayers` lower than the number of connected players don't disconnect anyone: every player gets the new game, and the server rejects connecting clients until fewer than `maxPlayers` players are connected.

A player who has sent the close frame has disconnected, like a player whose connection the server closes for an invalid message or frame: the server removes them at once, so they no longer count toward `maxPlayers`, in `PLAYERS` or in a turn, although the connection closes only once their network answers, which takes up to 30 s if it stalls. A connection that drops without a close frame is removed when the server notices that it has closed.

### Example: `GAME`

A game with the default settings, shortened to a 3×3 map; the real map has `mapSize` × `mapSize` squares, here 14×14.

```json
{
    "type": "GAME",
    "clearData": {
        "map": [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
        "treasurePosition": {"x": 2, "y": 1},
        "heroPosition": {"x": 0, "y": 0},
        "gameId": 1,
        "settings": {"mapSize": 14, "holeRatio": 33, "actors": "cat", "tiles": "garden", "maxPlayers": 10, "timeLimit": 60},
        "remainingMs": 60000
    }
}
```

### Example: `GAME` after a timeout

The 60 s of the game above ran out, so the server starts the next game with the same settings, shortened to a 3×3 map again.

```json
{
    "type": "GAME",
    "clearData": {
        "map": [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
        "treasurePosition": {"x": 1, "y": 2},
        "heroPosition": {"x": 2, "y": 0},
        "gameId": 2,
        "settings": {"mapSize": 14, "holeRatio": 33, "actors": "cat", "tiles": "garden", "maxPlayers": 10, "timeLimit": 60},
        "remainingMs": 60000,
        "timeout": true
    }
}
```

### Example: `MOVES`

A turn of two players; the first one's move arrived first.

```json
{"type": "MOVES", "clearData": ["UP", "LEFT"]}
```

### Example: `PLAYERS`

Two players are connected.

```json
{"type": "PLAYERS", "clearData": 2}
```

### Example: `REJECTED`

Ten players are connected with the default settings, so the server rejects the eleventh client.

```json
{"type": "REJECTED", "clearData": null}
```

## Client → server

| `type` | `clearData` | When |
|---|---|---|
| `MOVE` | `{"direction": <direction>, "gameId": <game ID>}` | The player presses an arrow key or swipes. `gameId` is the one of the last `GAME` the client received. The client sends at most one move per turn. |
| `SETTINGS` | Settings | The player applies the settings form with values that differ from the settings of the last `GAME` the client received. |

### Example: `MOVE`

The player moves up in the game with `gameId` 1.

```json
{"type": "MOVE", "clearData": {"direction": "UP", "gameId": 1}}
```

### Example: `SETTINGS`

The player applies a 20×20 map with 40 % holes and the snake and volcano textures.

```json
{"type": "SETTINGS", "clearData": {"mapSize": 20, "holeRatio": 40, "actors": "snake", "tiles": "volcano", "maxPlayers": 10, "timeLimit": 60}}
```

## Message flow

```text
client                            server
  | -- connect ----------------------> |  fewer than maxPlayers players are connected
  | <--------------------------- GAME  |  a new game or the running one
  | <------------------------ PLAYERS  |  to all players
  | -- MOVE -------------------------> |  each player once per turn
  | <-------------------------- MOVES  |  when the turn has a move per connected player
  | <--------------------------- GAME  |  only if the turn ended the game
  | -- SETTINGS ---------------------> |  any time
  | <--------------------------- GAME  |  to all players, the moves of the turn are discarded
  | <--------------------------- GAME  |  when the time limit runs out, with timeout, to all players
  | -- an invalid message -----------> |
  | <---------------------- close 1008 |  the player leaves the turn
  | -- an invalid frame -------------> |
  | <-------------- close 1007 or 1002 |  the player leaves the turn

client                            server
  | -- connect ----------------------> |  maxPlayers or more players are connected
  | <----------------------- REJECTED  |  instead of GAME and PLAYERS
  | <---------------------- close 1000 |
```

## Validation

The server rejects a client message when:

- it is sent as a binary frame, even if its bytes are valid JSON;
- it isn't valid JSON, for example a raw direction string `UP`;
- it isn't a JSON object, for example `null`, `"UP"` or an array;
- its `type` is missing or isn't a client message type; only `MOVE` and `SETTINGS` are, so server types such as `GAME` sent by a client are rejected too;
- it is a `MOVE` whose `clearData` isn't an object or whose `clearData.direction` isn't a value of `DIRECTION`; values are case-sensitive;
- it is a `MOVE` whose `clearData.gameId` is missing or isn't an integer;
- it is a `SETTINGS` with a field other than `type` and `clearData`;
- it is a `SETTINGS` whose `clearData` isn't an object, lacks a field of [`shared/settings.json`](../shared/settings.json) or has a field that file doesn't define; field names are case-sensitive;
- it is a `SETTINGS` with a field whose value has another JS type than the `type` of the field in `shared/settings.json`, a number that isn't an integer within `min` and `max` (inclusive) or a string that isn't among `values`; strings are case-sensitive.

The server closes the connection of a client that sent a rejected message with the close code `1008` (policy violation) and the reason `invalid message`, both in `CLOSE.INVALID_MESSAGE`, and handles it as a disconnect (see `MOVES`): the turn no longer waits for the player, so it doesn't wait for a client that considers its move sent, for example an outdated client. A move the player already sent in the current turn stays and counts. Messages that arrive from the client after the rejected one don't count.

Frames that break the WebSocket protocol never reach the game: for example a text frame that isn't valid UTF-8, a frame with reserved bits set or an unknown opcode. The server's WebSocket library closes the connection with its own close code, such as `1007` for invalid UTF-8 or `1002` for a protocol error, and the server handles it as a disconnect, the same as a rejected message.

The server ignores a valid `MOVE` whose `gameId` isn't the one of the current game, for example a move the client sent for a game that has just ended, and a second `MOVE` from the same player in the current turn: it doesn't count as a move, the server doesn't reply to it and the connection stays open. Fields this document doesn't specify in a `MOVE`, at the top level or inside `clearData`, are ignored; a `SETTINGS` with such a field is rejected.

The equivalence classes and boundary values of client messages and the tests that cover them are listed in [test/README.md](../test/README.md#client-messages), and those of the time limit in [test/README.md](../test/README.md#time-limit).
