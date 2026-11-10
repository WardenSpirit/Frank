import { test, expect, beforeEach, vi } from "vitest";

const TILE_SIZE = 16;
const INTERVAL = 300;

// The parser keeps the animation between the games, so each test starts with a fresh module.
let heroParser;

beforeEach(async () => {
    vi.resetModules();
    heroParser = await import("../client/view/parser/heroParser.js");
});

// Only the width of the sheet matters to the parser.
function sheetOfFrames(frameCount) {
    return { width: frameCount * TILE_SIZE };
}

// The times just after the start of the intervals 1, 2, ...: the frame changes at each of them.
function changeTime(interval) {
    return interval * INTERVAL + 1;
}

// A time in the same interval as changeTime(interval), so the frame stays.
function laterTimeInInterval(interval) {
    return interval * INTERVAL + 2;
}

function originAt(time, image) {
    return heroParser.calculateHeroSourceOrigin(heroParser.STANDING, time, image);
}

test("the frame advances by one tile in each interval and wraps at the end of the sheet", () => {
    const sheet = sheetOfFrames(4);

    const xs = [1, 2, 3, 4, 5].map(interval => originAt(changeTime(interval), sheet).x);

    expect(xs).toEqual([16, 32, 48, 0, 16]);
});

// The last frame (x = 48) of a sheet of 4 frames is kept when the next game has a sheet of fewer frames. The frame has
// to lie inside the new sheet at once, not after the next change, or the hero isn't drawn until then.
test.each([
    { frameCount: 1, expectedX: 0 },
    { frameCount: 2, expectedX: 16 },
    { frameCount: 3, expectedX: 0 },
])("a kept frame wraps at once on a sheet of $frameCount frames", ({ frameCount, expectedX }) => {
    [1, 2, 3].forEach(interval => originAt(changeTime(interval), sheetOfFrames(4)));

    const sheet = sheetOfFrames(frameCount);
    const origin = originAt(laterTimeInInterval(3), sheet);

    expect(origin.x).toBe(expectedX);
    expect(origin.x + TILE_SIZE).toBeLessThanOrEqual(sheet.width);
});

test("a kept frame stays on a wider sheet", () => {
    originAt(changeTime(1), sheetOfFrames(2)); // x = 16

    const origin = originAt(laterTimeInInterval(1), sheetOfFrames(4));

    expect(origin.x).toBe(16);
});
