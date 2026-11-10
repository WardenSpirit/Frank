import { test, expect, beforeEach, afterEach, vi } from "vitest";
import protocol from "../shared/protocol.json" with { type: "json" };
import { getDefaultSettings } from "../shared/settings.js";
import parametrizedTest, { parseNumber } from "./support/parametrizedTest.js";
import viewParams from "../client/view/viewParams.json" with { type: "json" };
import { createFakeCanvas } from "./support/fakeCanvas.js";
import { MAP_SIZES } from "./support/mapSizes.js";

const { TERRAIN, DIRECTION } = protocol;

// The test is about the canvas of the hero and the dust, so the view needs no images and none of the renderers that
// draw elsewhere. The hero and the dust need only the width of their sprite sheets: 4 tiles.
vi.mock("../client/view/images.js", () => ({
    getImage: vi.fn(async () => ({ width: 64 })),
    getTextureImages: vi.fn(async () => []),
}));
// `renderMap` resolves when the test lets it, so the test can stop the drawing of a game in the middle.
const mapDrawing = vi.hoisted(() => ({ promise: undefined }));
vi.mock("../client/view/renderer/terrainRenderer.js", () => ({ renderMap: vi.fn(() => mapDrawing.promise) }));
vi.mock("../client/view/renderer/treasureRenderer.js", () => ({ renderTreasure: vi.fn() }));
vi.mock("../client/view/renderer/tableRenderer.js", () => ({ renderTable: vi.fn() }));
vi.mock("../client/view/renderer/statsRenderer.js", () => ({ renderPoints: vi.fn(), renderPlayers: vi.fn() }));
vi.mock("../client/view/renderer/infoTextRenderer.js", () => ({ clearInfoText: vi.fn(), renderInfoText: vi.fn() }));
vi.mock("../client/view/renderer/filterRenderer.js", () => ({ displayFilter: vi.fn() }));
vi.mock("../client/view/renderer/settingsRenderer.js", () => ({
    renderSettingsForm: vi.fn(),
    clearSettingsForm: vi.fn(),
}));

// The sizes of the canvases in client/index.html.
const CANVAS_SIZE = 224;
const TABLE_CANVAS_HEIGHT = 47;

// The default map is 14 × 14 tiles of 16 pixels.
const DEFAULT_MAP_SIZE = 14;
// A tile on the canvas is as big as in the images, so the hero and the dust are drawn without scaling.
const TILE_SIZE = viewParams.sourceTileSize;

// Every map can show these positions, because the smallest map is 5 × 5. The hero of the previous game moves one tile
// to the right and leaves dust behind; the hero of the next game stands on a tile where the hero of the previous game
// never was.
const PREVIOUS_HERO_START = { x: 2, y: 1 };
const PREVIOUS_HERO_END = { x: 3, y: 1 };
const NEXT_HERO = { x: 4, y: 4 };

// The dust animation of 4 phases lasts 4 × 150 ms from its spawn, so the dust still animates when the next game starts.
const FIRST_GAME_TIME = 1000;
const MOVE_TIME = 1100;
const NEXT_GAME_TIME = 1200;
const FRAME_TIMES_AFTER_NEXT_GAME = [1300, 1500];
// The dust of a move at FIRST_GAME_TIME is at its last phase at 1550 and gone at 1600.
const DUST_FRAME_TIMES = [1100, 1250, 1400, 1550, 1700];

let frameCallbacks;
let mapRelease;

beforeEach(() => {
    // The fake timers keep Date, which the dust animation reads, and the timeout of the info text under control.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    frameCallbacks = [];
    mapDrawing.promise = Promise.resolve();
    mapRelease = undefined;
    vi.stubGlobal("requestAnimationFrame", callback => {
        frameCallbacks.push(callback);
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

/**
 * Opens a page: loads the view on fresh canvases, as a browser does when a player opens the game. Opening another page
 * discards this one, because they share the animation frames of the fake browser.
 */
async function openPage() {
    vi.resetModules();
    frameCallbacks = [];
    const objects = createFakeCanvas({ width: CANVAS_SIZE, height: CANVAS_SIZE });
    vi.stubGlobal("document", {
        querySelector: selector => {
            if (selector === "#hero") {
                return objects.canvas;
            }
            const height = selector === "#table" || selector === "#stats" ? TABLE_CANVAS_HEIGHT : CANVAS_SIZE;
            return { width: CANVAS_SIZE, height, getContext: () => ({}) };
        },
    });
    const view = await import("../client/view/view.js");
    const terrainRenderer = await import("../client/view/renderer/terrainRenderer.js");

    return {
        view,
        terrainRenderer,
        describeObjects: () => objects.describePainted(),
        fractionalCalls: () => objects.fractionalCalls(),
        async renderGameAt(time, game) {
            vi.setSystemTime(time);
            await view.renderGame(game);
        },
        // Runs the callbacks the animation of the hero and the dust asked for, then lets the drawing which they started
        // finish: the dust loads its image first.
        async animationFrameAt(time) {
            vi.setSystemTime(time);
            const callbacks = frameCallbacks;
            frameCallbacks = [];
            callbacks.forEach(callback => callback(time));
            await new Promise(resolve => setImmediate(resolve));
        },
    };
}

function createGame(mapSize, heroPosition) {
    return {
        gameId: 1,
        map: Array.from({ length: mapSize }, () => Array(mapSize).fill(TERRAIN.PATH)),
        heroPosition,
        treasurePosition: { x: 0, y: 0 },
        points: 0,
        settings: getDefaultSettings(),
    };
}

/**
 * What a player sees on the canvas of the hero when the game is the first one they open.
 */
async function describeFirstGame(game) {
    const page = await openPage();
    await page.renderGameAt(NEXT_GAME_TIME, game);
    for (const time of FRAME_TIMES_AFTER_NEXT_GAME) {
        await page.animationFrameAt(time);
    }
    return page.describeObjects();
}

// How the canvas describes the tiles of a row of the map, from the tile at `first` to the tile at `last` (same y).
function describeTilesInRow(first, last) {
    const top = first.y * TILE_SIZE;
    return `y ${top}-${top + TILE_SIZE - 1}: x ${first.x * TILE_SIZE}-${last.x * TILE_SIZE + TILE_SIZE - 1}`;
}

test.each(MAP_SIZES)("the hero stands exactly on its tile on a map of $mapSize × $mapSize", async ({ mapSize }) => {
    // Arrange
    const heroPosition = { x: mapSize - 1, y: mapSize - 2 };
    const expected = [describeTilesInRow(heroPosition, heroPosition)];
    const page = await openPage();

    // Act
    await page.renderGameAt(FIRST_GAME_TIME, createGame(mapSize, heroPosition));
    await page.animationFrameAt(FIRST_GAME_TIME);
    const actual = page.describeObjects();

    // Assert
    expect(actual).toEqual(expected);
});

test.each(MAP_SIZES)("the dust fills the tile the hero left on a map of $mapSize × $mapSize", async ({ mapSize }) => {
    // Arrange
    const start = { x: mapSize - 2, y: 1 };
    const end = { x: mapSize - 1, y: 1 };
    const expected = [describeTilesInRow(start, end)];
    const page = await openPage();
    await page.renderGameAt(FIRST_GAME_TIME, createGame(mapSize, start));
    await page.animationFrameAt(FIRST_GAME_TIME);

    // Act
    page.view.displayMove(start, end, DIRECTION.RIGHT);
    await page.animationFrameAt(DUST_FRAME_TIMES[0]);
    const actual = page.describeObjects();

    // Assert
    expect(actual).toEqual(expected);
});

test.each(MAP_SIZES)(
    "only the hero on its new tile stays once the dust is gone, drawn and cleared on whole pixels, on a map of $mapSize × $mapSize",
    async ({ mapSize }) => {
        // Arrange
        const start = { x: mapSize - 2, y: 1 };
        const end = { x: mapSize - 1, y: 1 };
        const expectedPainted = [describeTilesInRow(end, end)];
        const expectedFractionalCalls = [];
        const page = await openPage();
        await page.renderGameAt(FIRST_GAME_TIME, createGame(mapSize, start));
        await page.animationFrameAt(FIRST_GAME_TIME);

        // Act
        page.view.displayMove(start, end, DIRECTION.RIGHT);
        for (const time of DUST_FRAME_TIMES) {
            await page.animationFrameAt(time);
        }
        const actualPainted = page.describeObjects();
        const actualFractionalCalls = page.fractionalCalls();

        // Assert
        expect(actualPainted).toEqual(expectedPainted);
        expect(actualFractionalCalls).toEqual(expectedFractionalCalls);
    },
);

test("a fresh page draws the hero on its tile and no dust", async () => {
    // Arrange
    const expected = ["y 64-79: x 64-79"];
    const page = await openPage();

    // Act
    await page.renderGameAt(FIRST_GAME_TIME, createGame(DEFAULT_MAP_SIZE, { x: 4, y: 4 }));
    await page.animationFrameAt(FIRST_GAME_TIME);
    const actual = page.describeObjects();

    // Assert
    expect(actual).toEqual(expected);
});

parametrizedTest(
    "after a game of another map size, the canvas of the hero and the dust shows only the next game",
    "map-size-changes.csv",
    async ({ previousMapSize, nextMapSize }) => {
        // Arrange
        const expected = await describeFirstGame(createGame(parseNumber(nextMapSize), NEXT_HERO));
        const page = await openPage();
        await page.renderGameAt(FIRST_GAME_TIME, createGame(parseNumber(previousMapSize), PREVIOUS_HERO_START));
        await page.animationFrameAt(FIRST_GAME_TIME);
        page.view.displayMove(PREVIOUS_HERO_START, PREVIOUS_HERO_END, DIRECTION.RIGHT);
        await page.animationFrameAt(MOVE_TIME);

        // Act
        await page.renderGameAt(NEXT_GAME_TIME, createGame(parseNumber(nextMapSize), NEXT_HERO));
        for (const time of FRAME_TIMES_AFTER_NEXT_GAME) {
            await page.animationFrameAt(time);
        }
        const actual = page.describeObjects();

        // Assert
        expect(actual).toEqual(expected);
    },
);

test("an animation frame while the next game is being drawn doesn't draw the hero of the previous game", async () => {
    // Arrange
    const expected = [];
    const page = await openPage();
    await page.renderGameAt(FIRST_GAME_TIME, createGame(5, PREVIOUS_HERO_START));
    await page.animationFrameAt(FIRST_GAME_TIME);
    mapDrawing.promise = new Promise(resolve => {
        mapRelease = resolve;
    });

    // Act
    const rendering = page.renderGameAt(NEXT_GAME_TIME, createGame(20, NEXT_HERO));
    await vi.waitFor(() => expect(page.terrainRenderer.renderMap).toHaveBeenCalledTimes(2));
    await page.animationFrameAt(MOVE_TIME + 1000);
    const actual = page.describeObjects();

    // Assert
    expect(actual).toEqual(expected);
    mapRelease();
    await rendering;
});
