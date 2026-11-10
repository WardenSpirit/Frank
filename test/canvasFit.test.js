import { test, expect, beforeEach, afterEach, vi } from "vitest";
import protocol from "../shared/protocol.json" with { type: "json" };
import { getDefaultSettings } from "../shared/settings.js";
import viewParams from "../client/view/viewParams.json" with { type: "json" };
import { createFakeCanvas } from "./support/fakeCanvas.js";
import { MAP_SIZES } from "./support/mapSizes.js";

const { TERRAIN } = protocol;

// The renderers need no browser and no images, only the width of a sprite sheet: 4 tiles.
vi.mock("../client/view/images.js", () => ({ getImage: vi.fn(async () => ({ width: 64 })) }));

// The sizes of the canvases in client/index.html.
const INITIAL_CANVAS_SIZE = 224;
const TABLE_CANVAS_HEIGHT = 47;

// A tile on the canvas is as big as in the images, so it is drawn without scaling.
const TILE_SIZE = viewParams.sourceTileSize;

let mapCanvas;
let objectCanvas;
let drawingContext;
let terrainRenderer;
let treasureRenderer;

beforeEach(async () => {
    vi.resetModules();
    mapCanvas = createFakeCanvas({ width: INITIAL_CANVAS_SIZE, height: INITIAL_CANVAS_SIZE });
    objectCanvas = createFakeCanvas({ width: INITIAL_CANVAS_SIZE, height: INITIAL_CANVAS_SIZE });
    vi.stubGlobal("document", {
        querySelector: selector => {
            switch (selector) {
                case "#game":
                    return mapCanvas.canvas;
                case "#hero":
                    return objectCanvas.canvas;
                default: {
                    const height = selector === "#table" || selector === "#stats" ? TABLE_CANVAS_HEIGHT : 224;
                    return { width: INITIAL_CANVAS_SIZE, height, getContext: () => ({}) };
                }
            }
        },
    });
    drawingContext = await import("../client/view/renderer/drawingContext.js");
    terrainRenderer = await import("../client/view/renderer/terrainRenderer.js");
    treasureRenderer = await import("../client/view/renderer/treasureRenderer.js");
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// A map with paths and holes, so both kinds of terrain are drawn.
function createMap(mapSize) {
    return Array.from({ length: mapSize }, (_, x) =>
        Array.from({ length: mapSize }, (_, y) => ((x + y) % 3 === 0 ? TERRAIN.HOLE : TERRAIN.PATH)),
    );
}

function sizeOf({ canvas }) {
    return { width: canvas.width, height: canvas.height };
}

// The rectangles of all tiles of a map, as [x, y, width, height], in the order of x, then y.
function tileRectangles(mapWidth, mapHeight) {
    const rectangles = [];
    for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
            rectangles.push([x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE]);
        }
    }
    return rectangles;
}

const byPosition = (first, second) => first[0] - second[0] || first[1] - second[1];

test.each(MAP_SIZES)(
    "initSquareProportions fits the canvases of the map and the objects to a map of $mapSize × $mapSize",
    ({ mapSize }) => {
        // Arrange
        const expectedSize = { width: mapSize * TILE_SIZE, height: mapSize * TILE_SIZE };

        // Act
        drawingContext.initSquareProportions(mapSize, mapSize);
        const actualMapCanvas = sizeOf(mapCanvas);
        const actualObjectCanvas = sizeOf(objectCanvas);

        // Assert
        expect(actualMapCanvas).toEqual(expectedSize);
        expect(actualObjectCanvas).toEqual(expectedSize);
    },
);

test("initSquareProportions fits the width of the canvases to the first argument and the height to the second", () => {
    // Arrange
    const expectedSize = { width: 5 * TILE_SIZE, height: 8 * TILE_SIZE };

    // Act
    drawingContext.initSquareProportions(5, 8);
    const actualMapCanvas = sizeOf(mapCanvas);
    const actualObjectCanvas = sizeOf(objectCanvas);

    // Assert
    expect(actualMapCanvas).toEqual(expectedSize);
    expect(actualObjectCanvas).toEqual(expectedSize);
});

test.each(MAP_SIZES)(
    "renderMap covers the canvas with whole tiles, no gap and no overlap, on a map of $mapSize × $mapSize",
    async ({ mapSize }) => {
        // Arrange
        const expectedTiles = tileRectangles(mapSize, mapSize);
        const expectedCoverage = { uncovered: 0, once: (mapSize * TILE_SIZE) ** 2, more: 0 };
        drawingContext.initSquareProportions(mapSize, mapSize);

        // Act
        await terrainRenderer.renderMap(createMap(mapSize), getDefaultSettings());
        const actualTiles = mapCanvas.drawnRectangles().sort(byPosition);
        const actualCoverage = mapCanvas.coverage();

        // Assert
        expect(actualTiles).toEqual(expectedTiles);
        expect(actualCoverage).toEqual(expectedCoverage);
    },
);

test.each(MAP_SIZES)(
    "renderTreasure draws exactly on the tile of its position on a map of $mapSize × $mapSize",
    async ({ mapSize }) => {
        // Arrange
        const position = { x: mapSize - 1, y: mapSize - 2 };
        const expected = [[position.x * TILE_SIZE, position.y * TILE_SIZE, TILE_SIZE, TILE_SIZE]];
        drawingContext.initSquareProportions(mapSize, mapSize);

        // Act
        await treasureRenderer.renderTreasure(position, getDefaultSettings());
        const actual = mapCanvas.drawnRectangles();

        // Assert
        expect(actual).toEqual(expected);
    },
);
