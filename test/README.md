# Unit and integration tests

Run `npm ci` and `npm test` from the repository root with Node.js 22.x (22.12 or newer), 24.x, or 26 or newer. Tests use Vitest. Cases use deterministic inputs and create their own game or factory where needed. Integration tests in `websocket.test.js` start the WebSocket server on a free port and connect real clients to it.

## Cases and inputs

For parametrized tests, `support/parametrizedTest.js` uses Vitest's `test.each` to run each row as a named test. Its `parseBoolean` and `parseNumber` exports reject malformed values instead of silently converting them.

CSV files in `fixtures/` have a header, a unique behavior `name`, inputs, and expected outputs.

Client messages contain quotes and commas, which the CSV loader doesn't support, so they are in `fixtures/client-messages.json`. Each case has an `id` from [Client messages](#client-messages), a unique `name`, either a `message` that the test serializes to JSON or raw `data`, and the `expected` parsed message, or `null` for a message the server rejects.

After each integration test, a client applies the default settings and disconnects, because the server keeps them even after all players disconnect. Integration tests that need a game to end walk the hero along a shortest path to a hole or the treasure, which `support/pathToGameEnd.js` finds on the random map the server sent. `GameClient.sync` pings the server and waits for the pong. The server answers a ping only after handling the earlier messages of the socket, so tests can check that a turn hasn't ended yet and fix the order in which moves of several players arrive.

Movement fixtures use `last` for the final coordinate on each axis of a map with the default `mapSize`. Hole-count fixtures specify `mapSize`, `holeRatio`, a constant random value and the expected number of holes, see [Map generation](#map-generation).

| Units | Rules and input classes | Data |
|---|---|---|
| `getRandomIndex`, `getRandomElement` | First, interior and last random selection, single-element arrays | `fixtures/array-index.csv`, `array.test.js` |
| `makeMove` | Four directions, interior positions, each map edge | `fixtures/game-moves.csv` |
| `isGameBeingFinished`, `makeMoves` | Path, treasure, hole, empty and nonterminal batches, command order at termination | `fixtures/game-finished.csv`, `game.test.js` |
| `generateMap` | Dimensions from `mapSize`, valid terrain, hole count from `mapSize` and `holeRatio` rounded down or up | `fixtures/map-holes.csv`, `gameFactory.test.js` |
| `positionsAround`, `findSameLand`, `generateTwoSameLandPositions`, `createGame` | Wraparound neighbours, connected and disconnected paths, diagonal separation, valid starting positions, the next `gameId` for each new game, the settings of the game, a game for each combination of the bounds of `mapSize` and `holeRatio` | `gameFactory.test.js` |
| `parseClientMessage`, `parseSettings` | JSON syntax, top-level value, `type`, `clearData`, direction and `gameId` of client messages, fields not in the protocol, the fields of `SETTINGS` and their types, ranges and allowed strings | `fixtures/client-messages.json`, `clientMessage.test.js` |
| `onConnect` with client messages | Accepted and rejected messages, a rejected player leaving the turn, a second move in a turn, moves gathered before a turn ends, moves for the previous game after a turn or a disconnect has ended it, for the current and for the next game, a new game on valid settings, rejected settings, settings and a move in both delivery orders, several settings | `websocket.test.js` |
| `onConnect` with settings across games | The default settings of the first game, the current settings kept by the next game after a finished one, by the running game a player connects to and by a new game after all players disconnect and one connects, a map of `mapSize` × `mapSize` | `websocket.test.js` |
| `getListenHost` | `LISTEN_HOST` unset, empty and set to a custom value (`0.0.0.0`), `HOST` set while `LISTEN_HOST` is unset | `listenHost.test.js` |
| `changeSettingValue` | Valid setting values, increments and decrements, boundary values and wraparound; every value it returns from a valid one passes `parseSettings` | `fixtures/settings-values.csv`, `settings.test.js` |
| Settings form state and navigation | Default settings, opening and closing, highlight navigation and wraparound, submitting changed and unchanged settings, pending settings until a game comes, the form before the first game and after the connection closes, discarding unapplied edits, actions while closed, taking the settings of each game while the form is open and closed | `settings.test.js` |
| Settings form controller | Enter while the form is closed, Apply with an open connection and without one | `controlsSettings.test.js` |
| `applyMoves` of the client model | Whether the game goes on after a move onto a path, onto the treasure and into a hole, no moves, and moves after the treasure that it skips | `model.test.js` |
| `closeConnection` of the client model | Dropping the active and pending settings | `model.test.js` |
| `renderPoints`, `renderPlayers` | The position and the fixed size of the digits on the smallest, default and largest map, clearing the digits drawn for a map of another size | `statsRenderer.test.js` |

## Tests

`npm run test:report` writes `.vitest/junit.xml` which can be used by CI/CD pipelines to report test results.

`npm run test:coverage` prints coverage and writes `coverage/cobertura-coverage.xml` for the selected server modules, `shared/settings.js` and `client/settings.js`. The server requires `shared/settings.js` outside Vite, so its coverage only counts tests that import it; `clientMessage.test.js` therefore also runs the `SETTINGS` cases whose validity depends only on `clearData` directly through `parseSettings`.

`parameterParsing.test.js` checks valid numbers and booleans and rejects malformed cells. Its inline cases include empty and missing values that the CSV loader itself would reject.

## Client messages

Equivalence classes (EC) and boundary values (BV) of a message a client sends to the server, as specified in [docs/PROTOCOL.md](../docs/PROTOCOL.md). The Server column says what the server does with a message of the class:

- The server accepts a `MOVE` only if it falls into an accepted class in every category of EC1–EC19, EC24–EC26 and EC30–EC31, and a `SETTINGS` only if it does so in every category of EC1–EC4, EC30–EC31 and EC33–EC48, where EC33 is a class of the category `type`. One rejected class is enough to reject a message, and the server then closes the connection with code `1008` and reason `invalid message`.
- A text frame that isn't valid UTF-8 (EC32) breaks the WebSocket protocol, so it never reaches the validation; the server's WebSocket library closes the connection with code `1007`.
- An accepted `MOVE` then falls into a class of each category that depends on the turn and the game (EC20–EC23, EC27–EC29): the server records the move or ignores it and keeps the connection open, and then waits for the other players or ends the turn.
- An accepted `SETTINGS` then falls into a class of each category that depends on the turn and the other messages (EC49–EC53): the server always starts a new game with the settings and sends it to all players.

Each test name starts with the IDs it covers.

| ID | Category | Class | Server | Representatives | Tests |
|---|---|---|---|---|---|
| EC1 | JSON syntax | valid JSON | accepts | every case except EC2 and BV1 | via EC13 |
| EC2 | JSON syntax | not JSON | rejects | `UP`, `{"type":"MOVE"` | `clientMessage.test.js`, `websocket.test.js` |
| EC3 | top-level value | an object | accepts | `{"type":"MOVE",…}` | via EC13 |
| EC4 | top-level value | not an object | rejects | `null`, `1`, `"UP"`, `["MOVE",…]` | `clientMessage.test.js` |
| EC5 | `type` | `MOVE` | accepts | `MOVE` | via EC13 |
| EC6 | `type` | missing | rejects | `{"clearData":…}` | `clientMessage.test.js`, `websocket.test.js` |
| EC7 | `type` | a server message type | rejects | `GAME`, `MOVES`, `PLAYERS` | `clientMessage.test.js` |
| EC8 | `type` | another string | rejects | `JUMP`, `toString`, `__proto__` | `clientMessage.test.js`, `websocket.test.js` |
| EC9 | `type` | not a string | rejects | `1`, `null` | `clientMessage.test.js` |
| EC10 | `clearData` of `MOVE` | an object | accepts | `{"direction":"UP","gameId":1}` | via EC13 |
| EC11 | `clearData` of `MOVE` | missing | rejects | `{"type":"MOVE"}` | `clientMessage.test.js` |
| EC12 | `clearData` of `MOVE` | not an object | rejects | `"UP"`, `null`, `["UP"]`, `0` | `clientMessage.test.js`, `websocket.test.js` |
| EC13 | `clearData.direction` | a value of `DIRECTION` | accepts | `UP`, `RIGHT`, `DOWN`, `LEFT` | `clientMessage.test.js` |
| EC14 | `clearData.direction` | missing | rejects | `{"gameId":1}` | `clientMessage.test.js` |
| EC15 | `clearData.direction` | another string | rejects | `NORTH` | `clientMessage.test.js`, `websocket.test.js` |
| EC16 | `clearData.direction` | not a string | rejects | `0`, `null`, `["UP"]` | `clientMessage.test.js` |
| EC17 | fields not in the protocol | none | accepts | | via EC13 |
| EC18 | fields not in the protocol | at the top level | accepts, drops the field | `"extra": 7` | `clientMessage.test.js` |
| EC19 | fields not in the protocol | in `clearData` | accepts, drops the field | `"extra": 7` | `clientMessage.test.js` |
| EC20 | the player's moves in the current turn | the first | records the move | | via EC21, BV8, BV9 |
| EC21 | the player's moves in the current turn | the second or a later one | ignores | | `websocket.test.js` |
| EC22 | moves gathered *k* of *n* connected players | *k* < *n* | waits for the other players | | via BV8 |
| EC23 | moves gathered *k* of *n* connected players | *k* = *n* | ends the turn and sends `MOVES` | | `websocket.test.js` |
| EC24 | `clearData.gameId` | an integer | accepts | `42`, `1.0`, `0`, `-1` | `clientMessage.test.js` |
| EC25 | `clearData.gameId` | missing | rejects | `{"direction":"UP"}` | `clientMessage.test.js`, `websocket.test.js` |
| EC26 | `clearData.gameId` | not an integer | rejects | `"1"`, `null`, `1.5`, `[1]` | `clientMessage.test.js` |
| EC27 | `gameId` compared with the current game *g* | equal to *g* | records the move | | `websocket.test.js` |
| EC28 | `gameId` compared with the current game *g* | the one of a previous game | ignores; the player can still move in the turn | | `websocket.test.js` |
| EC29 | `gameId` compared with the current game *g* | the one of a game that hasn't been created | ignores | | `websocket.test.js` |
| EC30 | frame type | text | accepts | | via EC13 |
| EC31 | frame type | binary | rejects | `Buffer` with a valid `MOVE` | `websocket.test.js` |
| EC32 | frame type | text that isn't valid UTF-8 | closes the connection with code `1007` | the byte `0xFF` | `websocket.test.js` |
| EC33 | `type` | `SETTINGS` | accepts | `SETTINGS` | `clientMessage.test.js`, `websocket.test.js` |
| EC34 | fields of `SETTINGS` beside `type` and `clearData` | none | accepts | | via EC33 |
| EC35 | fields of `SETTINGS` beside `type` and `clearData` | some | rejects | `"extra": 7` | `clientMessage.test.js`, `websocket.test.js` |
| EC36 | `clearData` of `SETTINGS` | an object | accepts | the default settings | via EC33 |
| EC37 | `clearData` of `SETTINGS` | missing | rejects | `{"type":"SETTINGS"}` | `clientMessage.test.js`, `websocket.test.js` |
| EC38 | `clearData` of `SETTINGS` | not an object | rejects | `null`, `[{…}]`, `"14"`, `14` | `clientMessage.test.js` |
| EC39 | fields of `clearData` of `SETTINGS` | exactly the fields of `shared/settings.json` | accepts | | via EC33 |
| EC40 | fields of `clearData` of `SETTINGS` | a field missing | rejects | each of the six fields | `clientMessage.test.js`, `websocket.test.js` |
| EC41 | fields of `clearData` of `SETTINGS` | an unknown field | rejects | `extra`, `MapSize`, `__proto__` | `clientMessage.test.js`, `websocket.test.js` |
| EC42 | a number field: `mapSize`, `holeRatio`, `maxPlayers`, `timeLimit` | an integer within the range | accepts | the defaults, `14.0`, BV14, BV15 and the like | `clientMessage.test.js` |
| EC43 | a number field | an integer outside the range | rejects | BV13, BV16 and the like | via BV13–BV28 |
| EC44 | a number field | a number that isn't an integer | rejects | the default + 0.5, such as `14.5` | `clientMessage.test.js`, `websocket.test.js` |
| EC45 | a number field | not a number | rejects | `"14"`, `null`, `true`, `[14]`, `{}` | `clientMessage.test.js`, `websocket.test.js` |
| EC46 | a string field: `actors`, `tiles` | a value of `values` | accepts | `snake`, `cat`, `volcano`, `garden` | `clientMessage.test.js` |
| EC47 | a string field | another string | rejects | `dog`, `desert` | `clientMessage.test.js`, `websocket.test.js` |
| EC48 | a string field | not a string | rejects | `0`, `null`, `["snake"]` | `clientMessage.test.js` |
| EC49 | moves gathered when `SETTINGS` arrives | some | discards them; every player can move in the new game | the applying player has moved | `websocket.test.js` |
| EC50 | settings compared with the current ones | equal | starts a new game anyway | the default settings | `websocket.test.js` |
| EC51 | order of a `SETTINGS` and a move of another player after the applying player has moved | `SETTINGS` first | starts a new game; ignores the move, whose `gameId` is the previous one | | `websocket.test.js` |
| EC52 | order of a `SETTINGS` and a move of another player after the applying player has moved | the move first | ends the turn, then starts a new game | | `websocket.test.js` |
| EC53 | several `SETTINGS` | from different players | applies the one it receives last | | `websocket.test.js` |

`type`, the direction and the string fields of `SETTINGS` come from unordered sets of strings, so their boundary values are the nearest invalid strings: a different letter case, an added space, and the empty string. A number field of `SETTINGS` has an inclusive range from `shared/settings.json`, so its boundaries are both ends and their outer neighbours. *k* can't exceed *n* because the server ignores a second move of a player (EC21). `gameId` only has to equal the one of the current game *g*, so its boundaries are the neighbours of *g*. The server numbers games consecutively, so *g* − 1 is the game a turn has just ended.

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
| BV13 | `mapSize` = min − 1 | `4` | EC43 | `clientMessage.test.js` |
| BV14 | `mapSize` = min | `5` | EC42 | `clientMessage.test.js` |
| BV15 | `mapSize` = max | `20` | EC42 | `clientMessage.test.js` |
| BV16 | `mapSize` = max + 1 | `21` | EC43 | `clientMessage.test.js`, `websocket.test.js` |
| BV17 | `holeRatio` = min − 1 | `-1` | EC43 | `clientMessage.test.js` |
| BV18 | `holeRatio` = min | `0` | EC42 | `clientMessage.test.js` |
| BV19 | `holeRatio` = max | `40` | EC42 | `clientMessage.test.js` |
| BV20 | `holeRatio` = max + 1 | `41` | EC43 | `clientMessage.test.js` |
| BV21 | `maxPlayers` = min − 1 | `0` | EC43 | `clientMessage.test.js` |
| BV22 | `maxPlayers` = min | `1` | EC42 | `clientMessage.test.js` |
| BV23 | `maxPlayers` = max | `10` | EC42 | `clientMessage.test.js` |
| BV24 | `maxPlayers` = max + 1 | `11` | EC43 | `clientMessage.test.js` |
| BV25 | `timeLimit` = min − 1 | `4` | EC43 | `clientMessage.test.js` |
| BV26 | `timeLimit` = min | `5` | EC42 | `clientMessage.test.js` |
| BV27 | `timeLimit` = max | `120` | EC42 | `clientMessage.test.js` |
| BV28 | `timeLimit` = max + 1 | `121` | EC43 | `clientMessage.test.js` |
| BV29 | letter case of `actors` | `Snake` | EC47 | `clientMessage.test.js` |
| BV30 | spaces around `actors` | `snake ` | EC47 | `clientMessage.test.js` |
| BV31 | length of `actors` 0 | `""` | EC47 | `clientMessage.test.js` |
| BV32 | letter case of `tiles` | `Volcano` | EC47 | `clientMessage.test.js` |
| BV33 | spaces around `tiles` | `volcano ` | EC47 | `clientMessage.test.js` |
| BV34 | length of `tiles` 0 | `""` | EC47 | `clientMessage.test.js` |

## Map generation

Equivalence classes (EC) and boundary values (BV) of the map that `GameFactory.createGame(settings)` generates from `mapSize` and `holeRatio`, as specified in [docs/PROTOCOL.md](../docs/PROTOCOL.md#data-types). Their ranges are in [`shared/settings.json`](../shared/settings.json). EC and BV IDs are numbered separately in each section.

The map has *h* = `mapSize`² · `holeRatio` / 100 holes rounded down or up. A square is a hole when the random value times the squares left is lower than the holes left, so the lowest random value 0 rounds *h* up and a value near 1 rounds it down. A whole *h* is exact for every random value.

| ID | Factor | Class | Representatives | Tests |
|---|---|---|---|---|
| EC1 | `mapSize` | an integer within `5..20` | `5`, `14`, `20` | `fixtures/map-holes.csv`, `gameFactory.test.js` |
| EC2 | `holeRatio` | `0`, no holes | `0` | `fixtures/map-holes.csv` |
| EC3 | `holeRatio` | an integer within `1..40` | `33`, `40` | `fixtures/map-holes.csv` |
| EC4 | *h* | a whole number | `5`/`40` (10), `20`/`33` (132) | `fixtures/map-holes.csv` |
| EC5 | *h* | a fraction | `14`/`33` (64.68), `5`/`33` (8.25) | `fixtures/map-holes.csv` |

| ID | Boundary | Value | Class | Tests |
|---|---|---|---|---|
| BV1 | the smallest map | `mapSize` `5` | EC1 | `fixtures/map-holes.csv`, `gameFactory.test.js` |
| BV2 | the largest map | `mapSize` `20` | EC1 | `fixtures/map-holes.csv`, `gameFactory.test.js` |
| BV3 | no holes | `holeRatio` `0` | EC2 | `fixtures/map-holes.csv`, `gameFactory.test.js` |
| BV4 | the most holes | `holeRatio` `40` | EC3 | `fixtures/map-holes.csv`, `gameFactory.test.js` |
| BV5 | the lowest random value | `0` | EC4, EC5 | `fixtures/map-holes.csv` |
| BV6 | a random value near the upper bound | `0.999` | EC4, EC5 | `fixtures/map-holes.csv` |

`createGame` generates a game for each of the four combinations of BV1–BV2 and BV3–BV4 with ten seeds: the map is `mapSize` × `mapSize`, *h* is rounded down or up, and the hero and the treasure are on distinct paths of the same land. With at most 40 % holes, every map has two neighbouring paths, so a game can always be created.

### Factors for combination testing

| Factor | Levels | Classes |
|---|---|---|
| `mapSize` | `5`, `14`, `20` | EC1 |
| `holeRatio` | `0`, `33`, `40` | EC2, EC3 |
| random value | `0`, `0.999` | BV5, BV6 |

## Settings form

Equivalence classes (EC), boundary values (BV), and state transitions for the settings form implemented in `client/settings.js`, with setting definitions in `shared/settings.json`. EC and BV IDs are numbered separately in each section, so EC1 here is not EC1 in [Client messages](#client-messages).

The tests in `test/settings.test.js` use `test/fixtures/settings-values.csv` and the `parametrizedTest` helper to verify that `changeSettingValue()` steps through valid values and wraps at the boundaries. The CSV contains 32 cases covering all six setting fields. Additional unit tests verify form submission, navigation, and state management.

### Equivalence classes

| ID | Factor | Valid class | Values | Tests |
|---|---|---|---|---|
| EC1 | `mapSize` | Valid integer | `5..20`, default `14` | via BV1–BV5 |
| EC2 | `holeRatio` | Valid integer | `0..40`, default `33` | via BV6–BV10 |
| EC3 | `actors` | First allowed value | `"snake"` | via BV11 |
| EC4 | `actors` | Second allowed value | `"cat"` | via BV12 |
| EC5 | `tiles` | First allowed value | `"volcano"` | via BV13 |
| EC6 | `tiles` | Second allowed value | `"garden"` | via BV14 |
| EC7 | `maxPlayers` | Valid integer | `1..10`, default `10` | via BV15–BV19 |
| EC8 | `timeLimit` | Valid integer | `5..120`, default `60` | via BV20–BV24 |

### Boundary values

For numeric fields, stepping below the minimum wraps to the maximum, while stepping above the maximum wraps to the minimum. For string fields, stepping in either direction selects the other allowed value because each field has two options.

| ID | Factor | Boundary or representative value | Step | Expected value | Class | Tests |
|---|---|---|---|---|---|---|
| BV1 | `mapSize` | Minimum: `5` | `-1` | `20` | EC1 | `settings.test.js` |
| BV2 | `mapSize` | Minimum: `5` | `+1` | `6` | EC1 | `settings.test.js` |
| BV3 | `mapSize` | Interior: `14` | `-1`, `+1` | `13`, `15` | EC1 | `settings.test.js` |
| BV4 | `mapSize` | Maximum: `20` | `-1` | `19` | EC1 | `settings.test.js` |
| BV5 | `mapSize` | Maximum: `20` | `+1` | `5` | EC1 | `settings.test.js` |
| BV6 | `holeRatio` | Minimum: `0` | `-1` | `40` | EC2 | `settings.test.js` |
| BV7 | `holeRatio` | Minimum: `0` | `+1` | `1` | EC2 | `settings.test.js` |
| BV8 | `holeRatio` | Interior: `33` | `-1`, `+1` | `32`, `34` | EC2 | `settings.test.js` |
| BV9 | `holeRatio` | Maximum: `40` | `-1` | `39` | EC2 | `settings.test.js` |
| BV10 | `holeRatio` | Maximum: `40` | `+1` | `0` | EC2 | `settings.test.js` |
| BV11 | `actors` | `"snake"` | `-1`, `+1` | `"cat"`, `"cat"` | EC3 | `settings.test.js` |
| BV12 | `actors` | `"cat"` | `-1`, `+1` | `"snake"`, `"snake"` | EC4 | `settings.test.js` |
| BV13 | `tiles` | `"volcano"` | `-1`, `+1` | `"garden"`, `"garden"` | EC5 | `settings.test.js` |
| BV14 | `tiles` | `"garden"` | `-1`, `+1` | `"volcano"`, `"volcano"` | EC6 | `settings.test.js` |
| BV15 | `maxPlayers` | Minimum: `1` | `-1` | `10` | EC7 | `settings.test.js` |
| BV16 | `maxPlayers` | Minimum: `1` | `+1` | `2` | EC7 | `settings.test.js` |
| BV17 | `maxPlayers` | Interior: `5` | `-1`, `+1` | `4`, `6` | EC7 | `settings.test.js` |
| BV18 | `maxPlayers` | Maximum: `10` | `-1` | `9` | EC7 | `settings.test.js` |
| BV19 | `maxPlayers` | Maximum: `10` | `+1` | `1` | EC7 | `settings.test.js` |
| BV20 | `timeLimit` | Minimum: `5` | `-1` | `120` | EC8 | `settings.test.js` |
| BV21 | `timeLimit` | Minimum: `5` | `+1` | `6` | EC8 | `settings.test.js` |
| BV22 | `timeLimit` | Interior: `60` | `-1`, `+1` | `59`, `61` | EC8 | `settings.test.js` |
| BV23 | `timeLimit` | Maximum: `120` | `-1` | `119` | EC8 | `settings.test.js` |
| BV24 | `timeLimit` | Maximum: `120` | `+1` | `5` | EC8 | `settings.test.js` |

All 24 boundary-value rows above represent 32 individual parametrized test cases in `test/fixtures/settings-values.csv`. Each case name starts with the BV it covers.

### Factors for combination testing

The six fields are the factors of the settings that `submitSettingsForm()` returns and the client sends in `SETTINGS`. Each numeric factor has three levels: its lower bound, a representative interior value and its upper bound. The string factors have two levels, one for each allowed value. A full combination has 3⁴ × 2² = 324 cases, so a later combination test can use a covering array of these levels instead.

| Factor | Levels | Classes |
|---|---|---|
| `mapSize` | `5`, `14`, `20` | EC1 |
| `holeRatio` | `0`, `33`, `40` | EC2 |
| `actors` | `"snake"`, `"cat"` | EC3, EC4 |
| `tiles` | `"volcano"`, `"garden"` | EC5, EC6 |
| `maxPlayers` | `1`, `5`, `10` | EC7 |
| `timeLimit` | `5`, `60`, `120` | EC8 |

### Settings form state and navigation

Additional tests in `test/settings.test.js` verify the behavior of the settings form beyond individual field values.

| Behavior | Expected result |
|---|---|
| Default settings | Returns the configured default values for all six fields, which `parseSettings` accepts |
| Open and close using `toggleSettingsForm()` | Opens a closed form and closes an open form |
| Highlight navigation | Moves between form items and wraps at both ends |
| Navigation while closed | Leaves the highlight unchanged |
| Select a valid form item | Updates the highlighted item |
| Select an unknown form item | Leaves the current highlight unchanged |
| Step a setting while closed | Does not modify the edited settings |
| Navigate between `APPLY` and `CLOSE` | Switches the highlighted button |
| Reopen the form | Resets the highlight and discards unapplied edits |
| Before the first game comes | Opens the form with the default settings; submitting returns `null` |
| Submit changed settings | Returns the complete edited settings with every field of `shared/settings.json`, makes them pending, and closes the form |
| Reopen the form before a game with other settings comes | Opens with the pending settings; applying them again returns `null`, an edit back to the active settings is submitted, closing discards edits back to the pending settings |
| Receive the settings of a game with other settings with `receiveSettings()` | Drops the pending settings |
| Receive the settings of a game with the same settings with `receiveSettings()` | Keeps the pending settings |
| Drop the settings with `dropSettings()`, as the model does once the connection closes | Drops the active and pending settings, so the form opens with the default settings and submitting returns `null`, as before the first game |
| Submit unchanged settings | Returns `null` and closes the form |
| Close with unapplied edits | Discards edits and reopens with the settings of the last game |
| Take the settings of a game | Changes are judged against them: an edit back to the defaults is submitted, an edit equal to settings another player applied meanwhile isn't |
| Take the settings of a game while the form is open | Keeps the edits, which are then submitted |
| Take the first game while a form opened before it is open | The submitted edits pass `parseSettings` |
| Take the settings of a game while the form is closed | Opens the form with them |

Each test imports a fresh instance of `client/settings.js` after `vi.resetModules()`, so the form state of one test doesn't leak into the next.

Invalid fields, steps and setting values are not included in the EC/BV fixtures because the settings form only passes fields of `shared/settings.json`, their valid values and steps of −1 and +1, so `changeSettingValue()` doesn't check them. The server validates every `SETTINGS` message (`clientMessage.test.js`). Instead, `settings.test.js` checks that the default settings, every value `changeSettingValue()` returns from a valid one and the submitted settings pass `parseSettings`, so the form can't produce settings the server rejects.

`submitSettingsForm()` doesn't check that the form is open, because the controller applies the settings only from an open form. `test/controlsSettings.test.js` checks this with mocks of the connection and the view, as well as that the controller sends settings only over an open connection:

| Behavior | Expected result |
|---|---|
| Press Enter after closing the form with unapplied edits | Leaves the key unhandled, keeps the form closed and sends no `SETTINGS` |
| Apply changed settings with an open connection | Sends them in a `SETTINGS` message, closes the form and clears the settings canvas |
| Apply changed settings without an open connection | Sends nothing, closes the form like Close and clears the settings canvas; the edits don't become pending, so the reopened form shows the active settings |

Each test imports a fresh instance of `client/controlsSettings.js` and `client/settings.js` after `vi.resetModules()` and clears the mocks, so the form state and the recorded calls of one test don't leak into the next.
