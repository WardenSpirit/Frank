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
| Settings | `{"mapSize": <integer>, "holeRatio": <integer>, "actors": <string>, "tiles": <string>, "maxPlayers": <integer>, "timeLimit": <integer>}` with every field of [`shared/settings.json`](../shared/settings.json), which defines the type, the allowed values and the default of each field. Ranges are inclusive and strings are case-sensitive. Only `mapSize` and `holeRatio` affect the game so far. |
| Game | `{"map": <map>, "treasurePosition": <position>, "heroPosition": <position>, "gameId": <game ID>, "settings": <settings>}`, where `settings` are the ones the game was created with. The first game since the server started has the default settings. |

## Server → client

| `type` | `clearData` | Sent to | When |
|---|---|---|---|
| `GAME` | Game | All players | A new game starts: the first player connects, a turn ends the game (after `MOVES`), or the server applies a valid `SETTINGS`, also in the middle of a turn and without `MOVES`. |
| `GAME` | Game | The connecting player | A player connects while a game is running. |
| `MOVES` | An array of directions in the order they arrived at the server | All players | A turn ends: the turn has as many moves as there are connected players, checked after every move and every disconnect. Moves of players who disconnected during the turn stay in the array and count, so a disconnect can end the turn before every connected player has moved. |
| `PLAYERS` | The number of connected players | All players | A player connects (after `GAME`) or disconnects. |

Clients apply `MOVES` in order and stop at the treasure or a hole, like the server does. After a turn that ends the game, the next message is `GAME` with a new game.

Every new game has the current settings: the defaults until the server applies a valid `SETTINGS`, then the settings of the last `SETTINGS` it received, even after all players disconnect. Valid settings always start a new game, even when they equal the current ones. The server discards the moves of the current turn, so every player can move in the new game, and moves sent for the previous game are ignored (see [Validation](#validation)). Clients take the settings of each `GAME` as the current ones, so a client sends `SETTINGS` only with values that differ from the settings of the last game, even if another player applied them.

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
        "settings": {"mapSize": 14, "holeRatio": 33, "actors": "snake", "tiles": "volcano", "maxPlayers": 10, "timeLimit": 60}
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

The player applies a 20×20 map with 40 % holes and the cat textures.

```json
{"type": "SETTINGS", "clearData": {"mapSize": 20, "holeRatio": 40, "actors": "cat", "tiles": "garden", "maxPlayers": 10, "timeLimit": 60}}
```

## Message flow

```text
client                            server
  | -- connect ----------------------> |
  | <--------------------------- GAME  |  a new game or the running one
  | <------------------------ PLAYERS  |  to all players
  | -- MOVE -------------------------> |  each player once per turn
  | <-------------------------- MOVES  |  when the turn has a move per connected player
  | <--------------------------- GAME  |  only if the turn ended the game
  | -- SETTINGS ---------------------> |  any time
  | <--------------------------- GAME  |  to all players, the moves of the turn are discarded
  | -- an invalid message -----------> |
  | <---------------------- close 1008 |  the player leaves the turn
  | -- an invalid frame -------------> |
  | <-------------- close 1007 or 1002 |  the player leaves the turn
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

The equivalence classes and boundary values of client messages and the tests that cover them are listed in [test/README.md](../test/README.md#client-messages).
