import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import settings from "../shared/settings.json" with { type: "json" };
import viewParams from "../client/view/viewParams.json" with { type: "json" };

const TEXTURES_DIRECTORY = new URL("../client/view/assets/textures/", import.meta.url);
const TILE = viewParams.sourceTileSize;

// The sprite sheets of a texture set and the number of the lines the client reads from each of them. The number of the
// frames in a line is free (the width only has to be a multiple of the tile), except for the holes.
const SHEETS = [
    // STANDING and the four directions of the move, see heroParser.js.
    { kind: "actors", file: "Hero.png", lines: 5 },
    // The last tile of the first line, see treasureParser.js.
    { kind: "actors", file: "Treasure.png", lines: 1 },
    // A random tile of the first line, see terrainParser.js.
    { kind: "tiles", file: "Path.png", lines: 1 },
    // The line and the column are 4-bit numbers of the surrounding tiles, see terrainParser.js.
    { kind: "tiles", file: "Hole.png", lines: 16, columns: 16 },
];

const CASES = SHEETS.flatMap(sheet =>
    settings[sheet.kind].values.map(texture => ({ ...sheet, texture, path: `${sheet.kind}/${texture}/${sheet.file}` })),
);

// Reads the size from the IHDR chunk, which always follows the 8-byte signature of a PNG file.
function readPngSize(path) {
    const data = readFileSync(new URL(path, TEXTURES_DIRECTORY));
    expect(data.subarray(1, 4).toString("latin1"), `${path} is a PNG file`).toBe("PNG");
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

// A texture set of the settings without a sprite sheet makes readFileSync throw, so every test below fails for it.
test.each(CASES)("$path has a width of whole tiles", ({ path }) => {
    const { width } = readPngSize(path);

    expect(width).toBeGreaterThanOrEqual(TILE);
    expect(width % TILE).toBe(0);
});

test.each(CASES)("$path has the height of $lines lines of tiles", ({ path, lines }) => {
    const { height } = readPngSize(path);

    expect(height).toBe(lines * TILE);
});

test.each(CASES.filter(({ columns }) => columns))("$path has $columns columns of tiles", ({ path, columns }) => {
    const { width } = readPngSize(path);

    expect(width).toBe(columns * TILE);
});
