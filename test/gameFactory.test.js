import { test, expect } from 'vitest';
import parametrizedTest, { parseNumber } from './support/parametrizedTest.js';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Game = require('../server/game');
const GameFactory = require('../server/gameFactory');
const { TERRAIN } = require('../shared/protocol.json');
const { MAP_WIDTH, MAP_HEIGHT } = require('../server/params.json');

// LCG parameters from Numerical Recipes in FORTRAN 77, section 7.1 (ranqd1):
// https://iate.oac.uncor.edu/~mario/materia/nr/numrec/f7-1.pdf#page=9
function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function filledMap(width, height, terrain = TERRAIN.HOLE) {
    return Array.from({ length: width }, () => Array(height).fill(terrain));
}

function terrainAt(map, position) {
    return map[position.x][position.y];
}

function sortPositions(positions) {
    return positions.toSorted((left, right) => left.x - right.x || left.y - right.y);
}

test('generateMap creates the configured map with valid terrain', () => {
    // Arrange
    const factory = new GameFactory(seededRandom(11));
    const expected = {
        width: MAP_WIDTH,
        heights: Array(MAP_WIDTH).fill(MAP_HEIGHT),
        validTerrain: true
    };

    // Act
    const map = factory.generateMap();
    const actual = {
        width: map.length,
        heights: map.map(column => column.length),
        validTerrain: map.flat().every(tile => tile === TERRAIN.PATH || tile === TERRAIN.HOLE)
    };

    // Assert
    expect(actual).toEqual(expected);
});

parametrizedTest('generateMap produces the expected hole count', 'map-holes.csv', testCase => {
    // Arrange
    const randomValue = parseNumber(testCase.randomValue);
    const factory = new GameFactory(() => randomValue);
    const expected = parseNumber(testCase.expectedHoles);

    // Act
    const map = factory.generateMap();
    const actual = map.flat().filter(tile => tile === TERRAIN.HOLE).length;

    // Assert
    expect(actual).toBe(expected);
});

test('positionsAround wraps across both map edges', () => {
    // Arrange
    const factory = new GameFactory();
    factory.map = filledMap(4, 3);
    const expected = sortPositions([
        { x: 0, y: 2 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 3, y: 0 }
    ]);

    // Act
    const actual = sortPositions(factory.positionsAround({ x: 0, y: 0 }));

    // Assert
    expect(actual).toEqual(expected);
});

test('findSameLand includes wraparound paths but excludes disconnected paths', () => {
    // Arrange
    const factory = new GameFactory();
    factory.map = filledMap(4, 4);
    for (const { x, y } of [
        { x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 3 },
        { x: 1, y: 1 }, { x: 1, y: 2 }
    ]) {
        factory.map[x][y] = TERRAIN.PATH;
    }
    const expected = sortPositions([{ x: 0, y: 3 }, { x: 3, y: 0 }]);

    // Act
    const actual = sortPositions(factory.findSameLand({ x: 0, y: 0 }));

    // Assert
    expect(actual).toEqual(expected);
});

test('findSameLand does not cross holes or count diagonally adjacent paths', () => {
    // Arrange
    const factory = new GameFactory();
    factory.map = filledMap(4, 4);
    factory.map[1][1] = TERRAIN.PATH;
    factory.map[2][2] = TERRAIN.PATH;
    const expected = [];

    // Act
    const actual = sortPositions(factory.findSameLand({ x: 1, y: 1 }));

    // Assert
    expect(actual).toEqual(expected);
});

test('findSameLand returns no positions when the starting square is a hole', () => {
    // Arrange
    const factory = new GameFactory();
    factory.map = filledMap(3, 3);
    factory.map[1][1] = TERRAIN.PATH;
    const expected = [];

    // Act
    const actual = sortPositions(factory.findSameLand({ x: 0, y: 0 }));

    // Assert
    expect(actual).toEqual(expected);
});

test('generateTwoSameLandPositions retries after holes and isolated paths', () => {
    // Arrange
    const randomValues = [0.9, 0.3, 0.5, 0.5, 0, 0, 0.99];
    let calls = 0;
    const factory = new GameFactory(() => randomValues[calls++]);
    factory.map = filledMap(4, 4);
    factory.map[0][0] = TERRAIN.PATH;
    factory.map[1][0] = TERRAIN.PATH;
    factory.map[2][0] = TERRAIN.PATH;
    factory.map[2][2] = TERRAIN.PATH;
    const expected = [{ x: 0, y: 0 }, { x: 2, y: 0 }];

    // Act
    const actual = factory.generateTwoSameLandPositions();

    // Assert
    expect(actual).toEqual(expected);
});

test('createGame puts the hero and treasure on distinct paths', () => {
    // Arrange
    const factory = new GameFactory(seededRandom(2026));
    const expected = {
        isGame: true,
        distinctPositions: true,
        heroTerrain: TERRAIN.PATH,
        treasureTerrain: TERRAIN.PATH
    };

    // Act
    const game = factory.createGame();
    const actual = {
        isGame: game instanceof Game,
        distinctPositions: game.heroPosition.x !== game.treasurePosition.x ||
            game.heroPosition.y !== game.treasurePosition.y,
        heroTerrain: terrainAt(game.map, game.heroPosition),
        treasureTerrain: terrainAt(game.map, game.treasurePosition)
    };

    // Assert
    expect(actual).toEqual(expected);
});
