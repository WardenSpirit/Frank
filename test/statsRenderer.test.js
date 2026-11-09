import { test, expect, beforeEach, afterEach, vi } from "vitest";

// The renderer needs neither a browser nor the image of the digits: fake canvases of the sizes in client/index.html
// record what it draws.
vi.mock("../client/view/images.js", () => ({ getImage: vi.fn(async () => ({})) }));

const CANVASES = {
    "#game": { width: 224, height: 224 },
    "#stats": { width: 224, height: 47 },
};
// The smallest, the default and the largest map.
const MAP_SIZES = [{ mapSize: 5 }, { mapSize: 14 }, { mapSize: 20 }];

let drawingContext;
let statsRenderer;
let stateContext;

beforeEach(async () => {
    vi.resetModules();
    stateContext = { drawImage: vi.fn(), clearRect: vi.fn() };
    vi.stubGlobal("document", {
        querySelector: selector => ({
            ...CANVASES[selector],
            getContext: () => (selector === "#stats" ? stateContext : {}),
        }),
    });
    drawingContext = await import("../client/view/renderer/drawingContext.js");
    statsRenderer = await import("../client/view/renderer/statsRenderer.js");
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// Each rectangle is [x, y, width, height], the last four arguments of drawImage.
function drawnRectangles() {
    return stateContext.drawImage.mock.calls.map(call => call.slice(-4));
}

function setMapSize(mapSize) {
    drawingContext.initSquareProportions(mapSize, mapSize);
}

test.each(MAP_SIZES)(
    "renderPoints draws the digits at the left of the canvas at a fixed size on a map of size $mapSize",
    ({ mapSize }) => {
        // Arrange
        setMapSize(mapSize);
        const expected = [
            [16, 16, 16, 16],
            [32, 16, 16, 16],
        ];

        // Act
        statsRenderer.renderPoints(12);
        const actual = drawnRectangles();

        // Assert
        expect(actual).toEqual(expected);
    },
);

test.each(MAP_SIZES)(
    "renderPlayers draws the digits at the right of the canvas at a fixed size on a map of size $mapSize",
    ({ mapSize }) => {
        // Arrange
        setMapSize(mapSize);
        const expected = [
            [176, 16, 16, 16],
            [192, 16, 16, 16],
        ];

        // Act
        statsRenderer.renderPlayers(12);
        const actual = drawnRectangles();

        // Assert
        expect(actual).toEqual(expected);
    },
);

test.each([
    { render: "renderPoints", expected: [[16, 16, 16, 16]] },
    { render: "renderPlayers", expected: [[192, 16, 16, 16]] },
])("$render clears exactly the digits drawn for a map of another size", ({ render, expected }) => {
    // Arrange
    setMapSize(5);
    statsRenderer[render](1);
    setMapSize(20);

    // Act
    statsRenderer[render](2);
    const actual = stateContext.clearRect.mock.calls;

    // Assert
    expect(actual).toEqual(expected);
});
