import { test, expect } from "vitest";
import parametrizedTest, { parseNumber, parseBoolean } from "./support/parametrizedTest.js";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Game = require("../server/game");
const { DIRECTION, TERRAIN } = require("../shared/protocol.json");
const { getDefaultSettings } = require("../shared/settings.js");

const MAP_WIDTH = getDefaultSettings().mapSize;
const MAP_HEIGHT = getDefaultSettings().mapSize;

function parseCoordinate(value, size) {
    return value === "last" ? size - 1 : parseNumber(value);
}

function emptyMap() {
    return Array.from({ length: MAP_WIDTH }, () => Array(MAP_HEIGHT).fill(TERRAIN.PATH));
}

function gameAt(hero, treasure = { x: 5, y: 5 }) {
    return new Game(emptyMap(), treasure, hero);
}

parametrizedTest("makeMove moves one square and wraps at map edges", "game-moves.csv", testCase => {
    // Arrange
    const game = gameAt({
        x: parseCoordinate(testCase.startX, MAP_WIDTH),
        y: parseCoordinate(testCase.startY, MAP_HEIGHT),
    });
    const direction = DIRECTION[testCase.direction];
    const expected = {
        x: parseCoordinate(testCase.expectedX, MAP_WIDTH),
        y: parseCoordinate(testCase.expectedY, MAP_HEIGHT),
    };

    // Act
    game.makeMove(direction);
    const actual = game.heroPosition;

    // Assert
    expect(actual).toEqual(expected);
});

test("makeMoves applies the whole batch when no move ends the game", () => {
    // Arrange
    const game = gameAt({ x: 3, y: 4 }, { x: 5, y: 5 });
    const moves = [DIRECTION.UP, DIRECTION.LEFT, DIRECTION.DOWN];
    const expected = { x: 2, y: 4 };

    // Act
    game.makeMoves(moves);
    const actual = game.heroPosition;

    // Assert
    expect(actual).toEqual(expected);
});

test("makeMoves with no commands leaves the hero in place", () => {
    // Arrange
    const game = gameAt({ x: 3, y: 4 });
    const moves = [];
    const expected = { x: 3, y: 4 };

    // Act
    game.makeMoves(moves);
    const actual = game.heroPosition;

    // Assert
    expect(actual).toEqual(expected);
});

parametrizedTest("isGameBeingFinished detects treasure and holes", "game-finished.csv", testCase => {
    // Arrange
    const hero = { x: parseNumber(testCase.heroX), y: parseNumber(testCase.heroY) };
    const treasure = { x: parseNumber(testCase.treasureX), y: parseNumber(testCase.treasureY) };
    const game = gameAt(hero, treasure);
    if (parseBoolean(testCase.holeAtHero)) {
        game.map[hero.x][hero.y] = TERRAIN.HOLE;
    }
    const expected = parseBoolean(testCase.expectedFinished);

    // Act
    const actual = game.isGameBeingFinished();

    // Assert
    expect(actual).toBe(expected);
});

test("makeMoves applies commands in order and stops at treasure", () => {
    // Arrange
    const game = gameAt({ x: 0, y: 0 }, { x: 1, y: 0 });
    const moves = [DIRECTION.RIGHT, DIRECTION.RIGHT, DIRECTION.DOWN];
    const expectedPosition = { x: 1, y: 0 };
    const expectedFinished = true;

    // Act
    game.makeMoves(moves);
    const actualPosition = game.heroPosition;
    const actualFinished = game.isGameBeingFinished();

    // Assert
    expect(actualPosition).toEqual(expectedPosition);
    expect(actualFinished).toBe(expectedFinished);
});

test("makeMoves applies commands in order and stops at a hole", () => {
    // Arrange
    const game = gameAt({ x: 0, y: 0 });
    game.map[1][0] = TERRAIN.HOLE;
    const moves = [DIRECTION.RIGHT, DIRECTION.DOWN];
    const expectedPosition = { x: 1, y: 0 };
    const expectedFinished = true;

    // Act
    game.makeMoves(moves);
    const actualPosition = game.heroPosition;
    const actualFinished = game.isGameBeingFinished();

    // Assert
    expect(actualPosition).toEqual(expectedPosition);
    expect(actualFinished).toBe(expectedFinished);
});
