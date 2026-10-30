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
| Map | An array of `MAP_WIDTH` columns, each with `MAP_HEIGHT` values of `TERRAIN` (`0` path, `1` hole), indexed as `map[x][y]`. The sizes are in [`server/params.json`](../server/params.json). |
| Game ID | An integer that identifies a game. Each new game has one that differs from all previous games since the server started. Clients only send it back in `MOVE`. |
| Game | `{"map": <map>, "treasurePosition": <position>, "heroPosition": <position>, "gameId": <game ID>}` |

## Server → client

| `type` | `clearData` | Sent to | When |
|---|---|---|---|
| `GAME` | Game | All players | A new game starts: the first player connects, or a turn ends the game (after `MOVES`). |
| `GAME` | Game | The connecting player | A player connects while a game is running. |
| `MOVES` | An array of directions in the order they arrived at the server | All players | A turn ends: the turn has as many moves as there are connected players, checked after every move and every disconnect. Moves of players who disconnected during the turn stay in the array and count, so a disconnect can end the turn before every connected player has moved. |
| `PLAYERS` | The number of connected players | All players | A player connects (after `GAME`) or disconnects. |

Clients apply `MOVES` in order and stop at the treasure or a hole, like the server does. After a turn that ends the game, the next message is `GAME` with a new game.

### Example: `GAME`

A game on a 3×3 map; a real map has `MAP_WIDTH` × `MAP_HEIGHT` squares.

```json
{
    "type": "GAME",
    "clearData": {
        "map": [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
        "treasurePosition": {"x": 2, "y": 1},
        "heroPosition": {"x": 0, "y": 0},
        "gameId": 1
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

### Example: `MOVE`

The player moves up in the game with `gameId` 1.

```json
{"type": "MOVE", "clearData": {"direction": "UP", "gameId": 1}}
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
```

## Validation

The server ignores a client message when:

- it isn't valid JSON, for example a raw direction string `UP`;
- it isn't a JSON object, for example `null`, `"UP"` or an array;
- its `type` is missing or isn't a client message type; only `MOVE` is, so server types such as `GAME` sent by a client are ignored too;
- it is a `MOVE` whose `clearData` isn't an object or whose `clearData.direction` isn't a value of `DIRECTION`; values are case-sensitive;
- it is a `MOVE` whose `clearData.gameId` is missing or isn't an integer;
- it is a `MOVE` whose `gameId` isn't the one of the current game, for example a move the client sent for a game that has just ended;
- it is a second `MOVE` from the same player in the current turn.

An ignored message doesn't count as a move and the server doesn't reply to it; the current turn continues and waits for the remaining players. Fields this document doesn't specify, at the top level or inside `clearData`, are ignored.

The equivalence classes and boundary values of client messages and the tests that cover them are listed in [test/README.md](../test/README.md#client-messages).
