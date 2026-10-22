# Game logic unit tests

Run `npm ci` and `npm test` from the repository root with Node.js 22.x (22.12 or newer), 24.x, or 26 or newer. Tests use Vitest. Cases use deterministic inputs and create their own game or factory where needed.

## Cases and inputs

For parametrized tests, `support/parametrizedTest.js` uses Vitest's `test.each` to run each row as a named test. Its `parseBoolean` and `parseNumber` exports reject malformed values instead of silently converting them.

CSV files in `fixtures/` have a header, a unique behavior `name`, inputs, and expected outputs.

Movement fixtures use `last` for the final coordinate on each axis. Hole-count fixtures specify a constant random value and the expected number of holes. For the current 14×14 map with a ratio of 0.33, values 0 and 0.999 produce 65 and 64 holes respectively. Update these expectations if the map dimensions or hole ratio change.

| Units | Rules and input classes | Data |
|---|---|---|
| `getRandomIndex`, `getRandomElement` | First, interior and last random selection, single-element arrays | `fixtures/array-index.csv`, `array.test.js` |
| `makeMove` | Four directions, interior positions, each map edge | `fixtures/game-moves.csv` |
| `isGameBeingFinished`, `makeMoves` | Path, treasure, hole, empty and nonterminal batches, command order at termination | `fixtures/game-finished.csv`, `game.test.js` |
| `generateMap` | Configured dimensions, valid terrain, whole-cell hole count | `fixtures/map-holes.csv`, `gameFactory.test.js` |
| `positionsAround`, `findSameLand`, `generateTwoSameLandPositions`, `createGame` | Wraparound neighbours, connected and disconnected paths, diagonal separation and valid starting positions | `gameFactory.test.js` |

## Tests

`npm run test:report` writes `.vitest/junit.xml` which can be used by CI/CD pipelines to report test results.

`npm run test:coverage` prints coverage and writes `coverage/cobertura-coverage.xml` for the three selected server modules.

`parameterParsing.test.js` checks valid numbers and booleans and rejects malformed cells. Its inline cases include empty and missing values that the CSV loader itself would reject.
