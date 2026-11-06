import { test, expect } from 'vitest';
import parametrizedTest, { parseNumber } from './support/parametrizedTest.js';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Game = require('../server/game');
const GameFactory = require('../server/gameFactory');
const { getDefaultSettings } = require('../shared/settings.js');
const { TERRAIN } = require('../shared/protocol.json');
const SETTINGS_SCHEMA = require('../shared/settings.json');

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

test('generateMap creates a square map of mapSize with valid terrain', () => {
    // Arrange
    const factory = new GameFactory(seededRandom(11));
    const { mapSize, holeRatio } = getDefaultSettings();
    const expected = {
        width: mapSize,
        heights: Array(mapSize).fill(mapSize),
        validTerrain: true
    };

    // Act
    const map = factory.generateMap(mapSize, holeRatio);
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
    const map = factory.generateMap(parseNumber(testCase.mapSize), parseNumber(testCase.holeRatio));
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
    const game = factory.createGame(getDefaultSettings());
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

test('createGame gives each new game the next gameId', () => {
    // Arrange
    const factory = new GameFactory(seededRandom(7));
    const expected = [1, 2, 3];

    // Act
    const settings = getDefaultSettings();
    const actual = [factory.createGame(settings), factory.createGame(settings), factory.createGame(settings)].map(game => game.gameId);

    // Assert
    expect(actual).toEqual(expected);
});

test('createGame keeps the settings it was given', () => {
    // Arrange
    const factory = new GameFactory(seededRandom(5));
    const settings = { ...getDefaultSettings(), mapSize: 9, actors: 'cat' };
    const expected = { ...settings };

    // Act
    const actual = factory.createGame(settings).settings;

    // Assert
    expect(actual).toEqual(expected);
});

// Each bound of mapSize with each bound of holeRatio, with several seeds for the random positions.
test.each([
    { mapSize: SETTINGS_SCHEMA.mapSize.min, holeRatio: SETTINGS_SCHEMA.holeRatio.min },
    { mapSize: SETTINGS_SCHEMA.mapSize.min, holeRatio: SETTINGS_SCHEMA.holeRatio.max },
    { mapSize: SETTINGS_SCHEMA.mapSize.max, holeRatio: SETTINGS_SCHEMA.holeRatio.min },
    { mapSize: SETTINGS_SCHEMA.mapSize.max, holeRatio: SETTINGS_SCHEMA.holeRatio.max }
])('createGame generates a game for mapSize $mapSize and holeRatio $holeRatio', ({ mapSize, holeRatio }) => {
    // Arrange
    const settings = { ...getDefaultSettings(), mapSize: mapSize, holeRatio: holeRatio };
    const exactHoles = mapSize * mapSize * holeRatio / 100;
    const expected = Array(10).fill({
        width: mapSize,
        heights: Array(mapSize).fill(mapSize),
        holesRounded: true,
        distinctPositions: true,
        heroTerrain: TERRAIN.PATH,
        treasureTerrain: TERRAIN.PATH
    });

    // Act
    const actual = Array.from({ length: 10 }, (_, seed) => {
        const game = new GameFactory(seededRandom(seed)).createGame(settings);
        const holes = game.map.flat().filter(tile => tile === TERRAIN.HOLE).length;
        return {
            width: game.map.length,
            heights: game.map.map(column => column.length),
            holesRounded: holes === Math.floor(exactHoles) || holes === Math.ceil(exactHoles),
            distinctPositions: game.heroPosition.x !== game.treasurePosition.x ||
                game.heroPosition.y !== game.treasurePosition.y,
            heroTerrain: terrainAt(game.map, game.heroPosition),
            treasureTerrain: terrainAt(game.map, game.treasurePosition)
        };
    });

    // Assert
    expect(actual).toEqual(expected);
});
