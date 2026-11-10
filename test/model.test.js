import { test, expect, vi, beforeEach } from "vitest";
import protocol from "../shared/protocol.json" with { type: "json" };
import { getDefaultSettings } from "../client/settings.js";

const { TERRAIN, DIRECTION } = protocol;
const { PATH, HOLE } = TERRAIN;

// The model needs no canvases to decide whether the game goes on.
vi.mock("../client/view/view.js", () => ({
    renderGame: vi.fn(async () => {}),
    displayMove: vi.fn(),
    displayFilter: vi.fn(),
    displayPoints: vi.fn(),
    setInfoText: vi.fn(),
    displayPlayers: vi.fn(),
}));

let model;
let settings;
let view;

beforeEach(async () => {
    vi.resetModules();
    model = await import("../client/model.js");
    settings = await import("../client/settings.js");
    view = await import("../client/view/view.js");
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

/**
 * Gives the player the points the way the game does: by reaching the treasure. The model starts with 0 points.
 */
function gainPoints(count) {
    for (let i = 0; i < count; i++) {
        model.updateGame(createGame());
        model.applyMoves([DIRECTION.RIGHT]);
    }
}

/**
 * Records the calls of displayFilter and displayPoints in the order they happen, as ['filter', isGood] and
 * ['points', shownPoints]. The returned array fills while the model runs.
 */
function recordFilterAndPointsCalls() {
    const calls = [];
    view.displayFilter.mockImplementation(isGood => calls.push(["filter", isGood]));
    view.displayPoints.mockImplementation(shownPoints => calls.push(["points", shownPoints]));
    return calls;
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

// Stepping into a hole is the move that a timeout imitates, so its points and filter stay covered. The model shows the
// filter first and redraws the points only if they changed, so 0 points stay on the screen as they are.
test.each([
    {
        points: 1,
        expectedPoints: 0,
        expectedCalls: [
            ["filter", false],
            ["points", 0],
        ],
    },
    { points: 0, expectedPoints: 0, expectedCalls: [["filter", false]] },
])(
    "applyMoves into a hole from $points to $expectedPoints points shows the bad filter, then the changed points",
    ({ points, expectedCalls }) => {
        // Arrange
        gainPoints(points);
        model.updateGame(createGame());
        vi.clearAllMocks(); // the calls of the setup aren't under test
        const actualCalls = recordFilterAndPointsCalls();

        // Act
        model.applyMoves([DIRECTION.UP]);

        // Assert
        expect(actualCalls).toEqual(expectedCalls);
    },
);

// A game with the timeout mark counts as the hero stepping into a hole: the player loses a point (never below 0) and the
// bad filter shows, with the same calls as for a hole. The IDs are from the section Time limit of test/README.md.
test.each([
    {
        ids: "TL-EC14",
        name: "without the timeout field",
        timeoutField: {},
        points: 1,
        expectedPoints: 1,
        expectedCalls: [],
    },
    {
        ids: "TL-EC14",
        name: "with timeout false",
        timeoutField: { timeout: false },
        points: 1,
        expectedPoints: 1,
        expectedCalls: [],
    },
    {
        ids: "TL-EC15",
        name: "with timeout true",
        timeoutField: { timeout: true },
        points: 2,
        expectedPoints: 1,
        expectedCalls: [
            ["filter", false],
            ["points", 1],
        ],
    },
    {
        ids: "TL-EC15 TL-BV7",
        name: "with timeout true",
        timeoutField: { timeout: true },
        points: 1,
        expectedPoints: 0,
        expectedCalls: [
            ["filter", false],
            ["points", 0],
        ],
    },
    {
        ids: "TL-EC16 TL-BV8",
        name: "with timeout true",
        timeoutField: { timeout: true },
        points: 0,
        expectedPoints: 0,
        expectedCalls: [["filter", false]],
    },
])(
    "$ids updateGame of a game $name moves the points from $points to $expectedPoints",
    ({ timeoutField, points, expectedPoints, expectedCalls }) => {
        // Arrange
        gainPoints(points);
        const game = { ...createGame(), gameId: 2, ...timeoutField };
        let actualRenderedPoints;
        view.renderGame.mockImplementation(async renderedGame => {
            actualRenderedPoints = renderedGame.points;
        });
        vi.clearAllMocks(); // the calls of the setup aren't under test
        const actualCalls = recordFilterAndPointsCalls();
        const expected = { points: expectedPoints, renderedPoints: expectedPoints, calls: expectedCalls };

        // Act
        model.updateGame(game);
        const actual = { points: game.points, renderedPoints: actualRenderedPoints, calls: actualCalls };

        // Assert
        expect(actual).toEqual(expected);
    },
);

test("TL-EC14 TL-EC15 the point lost on a timeout stays lost in the next game", () => {
    // Arrange
    gainPoints(2);
    const timeoutGame = { ...createGame(), gameId: 2, timeout: true };
    const nextGame = { ...createGame(), gameId: 3 };
    const expectedPoints = [1, 1];

    // Act
    model.updateGame(timeoutGame);
    model.updateGame(nextGame);
    const actualPoints = [timeoutGame.points, nextGame.points];

    // Assert
    expect(actualPoints).toEqual(expectedPoints);
});

// A game whose image fails to load isn't drawn, so the screen keeps the previous game. The model still holds the new
// game and takes its moves; updateGame catches the rejection of renderGame. The mock of renderGame returns an object with
// only catch, because a real rejected promise would be handled by the spy itself and never count as unhandled.
test("updateGame catches the rejection of renderGame and the hero still moves", () => {
    // Arrange
    const game = createGame();
    const rendering = { catch: vi.fn() };
    view.renderGame.mockReturnValue(rendering);
    const expected = { catchHandlerType: "function", moveResult: true, heroPosition: { x: 1, y: 2 } };

    // Act
    model.updateGame(game);
    const moveResult = model.applyMoves([DIRECTION.DOWN]);
    const actual = {
        catchHandlerType: typeof rendering.catch.mock.calls[0]?.[0],
        moveResult,
        heroPosition: game.heroPosition,
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("closeConnection drops the active and pending settings", () => {
    // Arrange
    model.updateGame({ ...createGame(), settings: { ...getDefaultSettings(), tiles: "volcano" } });
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.submitSettingsForm();
    const expectedEdited = getDefaultSettings();

    // Act
    model.closeConnection();
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
});

// The connection opens before the server rejects the player or closes it, so "wait for game" is pending.
test.each([
    { name: "without a rejection", rejected: false, expected: ["maybe refresh", 0] },
    { name: "after a rejection", rejected: true, expected: ["game is full", 0] },
])('closeConnection $name leaves the info text "$expected.0"', ({ rejected, expected }) => {
    // Arrange
    model.openConnection();
    if (rejected) {
        model.rejectConnection();
    }

    // Act
    model.closeConnection();
    const actual = view.setInfoText.mock.calls.at(-1);

    // Assert
    expect(actual).toEqual(expected);
});
