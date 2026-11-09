import { test, expect, vi, beforeEach } from "vitest";
import protocol from "../shared/protocol.json" with { type: "json" };
import { getDefaultSettings } from "../client/settings.js";

const { TERRAIN, DIRECTION } = protocol;
const { PATH, HOLE } = TERRAIN;

// The model needs no canvases to decide whether the game goes on.
vi.mock("../client/view/view.js", () => ({
    renderGame: vi.fn(),
    displayMove: vi.fn(),
    displayFilter: vi.fn(),
    displayPoints: vi.fn(),
    setInfoText: vi.fn(),
    displayPlayers: vi.fn(),
}));

let model;
let settings;

beforeEach(async () => {
    vi.resetModules();
    model = await import("../client/model.js");
    settings = await import("../client/settings.js");
});

/**
 * A 3 × 3 game indexed as map[x][y] with the hero in the middle, the treasure on the right of it and a hole above it.
 */
function createGame() {
    return {
        gameId: 1,
        map: [
            [PATH, PATH, PATH],
            [HOLE, PATH, PATH],
            [PATH, PATH, PATH],
        ],
        heroPosition: { x: 1, y: 1 },
        treasurePosition: { x: 2, y: 1 },
        settings: getDefaultSettings(),
    };
}

test.each([
    { name: "a move onto a path", moves: [DIRECTION.DOWN], expected: true, expectedPosition: { x: 1, y: 2 } },
    { name: "a move onto the treasure", moves: [DIRECTION.RIGHT], expected: false, expectedPosition: { x: 2, y: 1 } },
    { name: "a move into a hole", moves: [DIRECTION.UP], expected: false, expectedPosition: { x: 1, y: 0 } },
    { name: "no moves", moves: [], expected: true, expectedPosition: { x: 1, y: 1 } },
    {
        name: "moves after the treasure",
        moves: [DIRECTION.RIGHT, DIRECTION.DOWN],
        expected: false,
        expectedPosition: { x: 2, y: 1 },
    },
])("applyMoves after $name returns $expected", ({ moves, expected, expectedPosition }) => {
    // Arrange
    const game = createGame();
    model.updateGame(game);

    // Act
    const actual = model.applyMoves(moves);

    // Assert
    expect(actual).toBe(expected);
    expect(game.heroPosition).toEqual(expectedPosition);
});

test("closeConnection drops the active and pending settings", () => {
    // Arrange
    model.updateGame({ ...createGame(), settings: { ...getDefaultSettings(), tiles: "garden" } });
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'snake' to 'cat'
    settings.submitSettingsForm();
    const expectedEdited = getDefaultSettings();

    // Act
    model.closeConnection();
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
});
