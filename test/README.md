# Unit and integration tests

Run `npm ci` and `npm test` from the repository root with Node.js 22.x (22.12 or newer), 24.x, or 26 or newer. Tests use Vitest. Cases use deterministic inputs and create their own game or factory where needed. Integration tests in `websocket.test.js` start the WebSocket server on a free port and connect real clients to it.

## Cases and inputs

For parametrized tests, `support/parametrizedTest.js` uses Vitest's `test.each` to run each row as a named test. Its `parseBoolean` and `parseNumber` exports reject malformed values instead of silently converting them.

CSV files in `fixtures/` have a header, a unique behavior `name`, inputs, and expected outputs.

Client messages contain quotes and commas, which the CSV loader doesn't support, so they are in `fixtures/client-messages.json`. Each case has an `id` from [Client messages](#client-messages), a unique `name`, either a `message` that the test serializes to JSON or raw `data`, and the `expected` parsed message, or `null` for a message the server ignores.

Integration tests that need a game to end walk the hero along a shortest path to a hole or the treasure, which `support/pathToGameEnd.js` finds on the random map the server sent. `GameClient.sync` pings the server and waits for the pong. The server answers a ping only after handling the earlier messages of the socket, so tests can check that a turn hasn't ended yet and fix the order in which moves of several players arrive.

Movement fixtures use `last` for the final coordinate on each axis. Hole-count fixtures specify a constant random value and the expected number of holes. For the current 14×14 map with a ratio of 0.33, values 0 and 0.999 produce 65 and 64 holes respectively. Update these expectations if the map dimensions or hole ratio change.

| Units | Rules and input classes | Data |
|---|---|---|
| `getRandomIndex`, `getRandomElement` | First, interior and last random selection, single-element arrays | `fixtures/array-index.csv`, `array.test.js` |
| `makeMove` | Four directions, interior positions, each map edge | `fixtures/game-moves.csv` |
| `isGameBeingFinished`, `makeMoves` | Path, treasure, hole, empty and nonterminal batches, command order at termination | `fixtures/game-finished.csv`, `game.test.js` |
| `generateMap` | Configured dimensions, valid terrain, whole-cell hole count | `fixtures/map-holes.csv`, `gameFactory.test.js` |
| `positionsAround`, `findSameLand`, `generateTwoSameLandPositions`, `createGame` | Wraparound neighbours, connected and disconnected paths, diagonal separation, valid starting positions and the next `gameId` for each new game | `gameFactory.test.js` |
| `parseClientMessage` | JSON syntax, top-level value, `type`, `clearData`, direction and `gameId` of client messages, fields not in the protocol | `fixtures/client-messages.json`, `clientMessage.test.js` |
| `onConnect` with client messages | Accepted and ignored messages, a second move in a turn, moves gathered before a turn ends, moves for the previous game after a turn or a disconnect has ended it, for the current and for the next game | `websocket.test.js` |

## Tests

`npm run test:report` writes `.vitest/junit.xml` which can be used by CI/CD pipelines to report test results.

`npm run test:coverage` prints coverage and writes `coverage/cobertura-coverage.xml` for the selected server modules.

`parameterParsing.test.js` checks valid numbers and booleans and rejects malformed cells. Its inline cases include empty and missing values that the CSV loader itself would reject.

## Client messages

Equivalence classes (EC) and boundary values (BV) of a message a client sends to the server, as specified in [docs/PROTOCOL.md](../docs/PROTOCOL.md). The server accepts a message only if it falls into an accepted class in every category; one ignored class is enough to ignore it. Each test name starts with the IDs it covers.

| ID | Category | Class | Server | Representatives | Tests |
|---|---|---|---|---|---|
| EC1 | JSON syntax | valid JSON | accepts | every case except EC2 and BV1 | via EC13 |
| EC2 | JSON syntax | not JSON | ignores | `UP`, `{"type":"MOVE"` | `clientMessage.test.js`, `websocket.test.js` |
| EC3 | top-level value | an object | accepts | `{"type":"MOVE",…}` | via EC13 |
| EC4 | top-level value | not an object | ignores | `null`, `1`, `"UP"`, `["MOVE",…]` | `clientMessage.test.js` |
| EC5 | `type` | `MOVE` | accepts | `MOVE` | via EC13 |
| EC6 | `type` | missing | ignores | `{"clearData":…}` | `clientMessage.test.js`, `websocket.test.js` |
| EC7 | `type` | a server message type | ignores | `GAME`, `MOVES`, `PLAYERS` | `clientMessage.test.js` |
| EC8 | `type` | another string | ignores | `JUMP`, `toString`, `__proto__` | `clientMessage.test.js`, `websocket.test.js` |
| EC9 | `type` | not a string | ignores | `1`, `null` | `clientMessage.test.js` |
| EC10 | `clearData` of `MOVE` | an object | accepts | `{"direction":"UP","gameId":1}` | via EC13 |
| EC11 | `clearData` of `MOVE` | missing | ignores | `{"type":"MOVE"}` | `clientMessage.test.js` |
| EC12 | `clearData` of `MOVE` | not an object | ignores | `"UP"`, `null`, `["UP"]`, `0` | `clientMessage.test.js`, `websocket.test.js` |
| EC13 | `clearData.direction` | a value of `DIRECTION` | accepts | `UP`, `RIGHT`, `DOWN`, `LEFT` | `clientMessage.test.js` |
| EC14 | `clearData.direction` | missing | ignores | `{"gameId":1}` | `clientMessage.test.js` |
| EC15 | `clearData.direction` | another string | ignores | `NORTH` | `clientMessage.test.js`, `websocket.test.js` |
| EC16 | `clearData.direction` | not a string | ignores | `0`, `null`, `["UP"]` | `clientMessage.test.js` |
| EC17 | fields not in the protocol | none | accepts | | via EC13 |
| EC18 | fields not in the protocol | at the top level | accepts, drops the field | `"extra": 7` | `clientMessage.test.js` |
| EC19 | fields not in the protocol | in `clearData` | accepts, drops the field | `"extra": 7` | `clientMessage.test.js` |
| EC20 | the player's moves in the current turn | the first | records the move | | via EC21, BV8, BV9 |
| EC21 | the player's moves in the current turn | the second or a later one | ignores | | `websocket.test.js` |
| EC22 | moves gathered *k* of *n* connected players | *k* < *n* | waits for the other players | | via BV8 |
| EC23 | moves gathered *k* of *n* connected players | *k* = *n* | ends the turn and sends `MOVES` | | `websocket.test.js` |
| EC24 | `clearData.gameId` | an integer | accepts | `42`, `1.0`, `0`, `-1` | `clientMessage.test.js` |
| EC25 | `clearData.gameId` | missing | ignores | `{"direction":"UP"}` | `clientMessage.test.js`, `websocket.test.js` |
| EC26 | `clearData.gameId` | not an integer | ignores | `"1"`, `null`, `1.5`, `[1]` | `clientMessage.test.js` |
| EC27 | `gameId` compared with the current game *g* | equal to *g* | records the move | | `websocket.test.js` |
| EC28 | `gameId` compared with the current game *g* | the one of a previous game | ignores; the player can still move in the turn | | `websocket.test.js` |
| EC29 | `gameId` compared with the current game *g* | the one of a game that hasn't been created | ignores | | `websocket.test.js` |

`type` and the direction come from unordered sets of strings, so their boundary values are the nearest invalid strings: a different letter case, an added space, and the empty string. *k* can't exceed *n* because the server ignores a second move of a player (EC21). `gameId` only has to equal the one of the current game *g*, so its boundaries are the neighbours of *g*. The server numbers games consecutively, so *g* − 1 is the game a turn has just ended.

| ID | Boundary | Value | Class | Tests |
|---|---|---|---|---|
| BV1 | message length 0 | an empty message | EC2 | `clientMessage.test.js` |
| BV2 | letter case of `type` | `move` | EC8 | `clientMessage.test.js` |
| BV3 | spaces around `type` | `MOVE ` | EC8 | `clientMessage.test.js` |
| BV4 | length of `type` 0 | `""` | EC8 | `clientMessage.test.js` |
| BV5 | letter case of the direction | `up` | EC15 | `clientMessage.test.js` |
| BV6 | spaces around the direction | `UP ` | EC15 | `clientMessage.test.js` |
| BV7 | length of the direction 0 | `""` | EC15 | `clientMessage.test.js` |
| BV8 | *k* = *n* − 1 | 2 players, 1 has moved | EC22 | `websocket.test.js` |
| BV9 | *k* = *n* | 2 players, both have moved | EC23 | `websocket.test.js` |
| BV10 | `gameId` = *g* − 1 | the game a turn has just ended | EC28 | `websocket.test.js` |
| BV11 | `gameId` = *g* | the current game | EC27 | `websocket.test.js` |
| BV12 | `gameId` = *g* + 1 | the game after the current one | EC29 | `websocket.test.js` |
