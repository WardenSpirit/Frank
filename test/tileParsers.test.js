import { test, expect, afterEach, vi } from "vitest";
import viewParams from "../client/view/viewParams.json" with { type: "json" };

const TILE = viewParams.sourceTileSize;

// The parsers read only the width of a sprite sheet, which differs between the texture sets.
function sheetOfTiles(tileCount) {
    return { width: tileCount * TILE };
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

test.each([
    { tileCount: 1, expectedX: 0 },
    { tileCount: 4, expectedX: 3 * TILE },
    { tileCount: 7, expectedX: 6 * TILE },
])(
    "getTreasureSource takes the last tile of the first line of a sheet of $tileCount tiles",
    async ({ tileCount, expectedX }) => {
        const { getTreasureSource } = await import("../client/view/parser/treasureParser.js");

        const actual = getTreasureSource(sheetOfTiles(tileCount));

        expect(actual).toEqual({ x: expectedX, y: 0 });
    },
);

// Math.random() is below 1, so the largest value gives the last tile of the sheet.
test.each([
    { tileCount: 1, random: 0.999, expectedX: 0 },
    { tileCount: 4, random: 0, expectedX: 0 },
    { tileCount: 4, random: 0.999, expectedX: 3 * TILE },
    { tileCount: 7, random: 0.5, expectedX: 3 * TILE },
])(
    "getPathSource takes a tile of the first line of a sheet of $tileCount tiles for the random value $random",
    async ({ tileCount, random, expectedX }) => {
        vi.spyOn(Math, "random").mockReturnValue(random);
        const { getPathSource } = await import("../client/view/parser/terrainParser.js");

        const actual = getPathSource(sheetOfTiles(tileCount));

        expect(actual).toEqual({ x: expectedX, y: 0 });
    },
);

// The dust sheet is loaded when the module is imported, so each test imports it with the sheet it needs.
async function importDustParser(tileCount) {
    vi.resetModules();
    vi.doMock("../client/view/images.js", () => ({ getImage: vi.fn(async () => sheetOfTiles(tileCount)) }));
    return import("../client/view/parser/dustParser.js");
}

test.each([
    { tileCount: 4, phase: 0, expected: { x: 0, y: 0 } },
    { tileCount: 4, phase: 3, expected: { x: 3 * TILE, y: 0 } },
    { tileCount: 4, phase: 4, expected: null },
    { tileCount: 6, phase: 5, expected: { x: 5 * TILE, y: 0 } },
    { tileCount: 6, phase: 6, expected: null },
])(
    "calculateDustSourceOrigin of the phase $phase on a sheet of $tileCount tiles is $expected",
    async ({ tileCount, phase, expected }) => {
        const { calculateDustSourceOrigin } = await importDustParser(tileCount);

        const actual = calculateDustSourceOrigin({ phase });

        expect(actual).toEqual(expected);
    },
);
