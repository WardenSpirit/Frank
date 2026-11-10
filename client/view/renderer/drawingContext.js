import viewParams from "../viewParams.json" with { type: "json" };

/**
 * Canvases and context configuration settings.
 */
const mapCanvas = document.querySelector("#game");
const objectCanvas = document.querySelector("#hero");
const filterCanvas = document.querySelector("#filter");
const tableCanvas = document.querySelector("#table");
const stateCanvas = document.querySelector("#stats");
const settingsCanvas = document.querySelector("#settings");

const mapContext = mapCanvas.getContext("2d");
const objectContext = objectCanvas.getContext("2d");
const filterContext = filterCanvas.getContext("2d");
const tableContext = tableCanvas.getContext("2d");
const stateContext = stateCanvas.getContext("2d");
const settingsContext = settingsCanvas.getContext("2d");

mapContext.imageSmoothingEnabled = false;
objectContext.imageSmoothingEnabled = false;
filterContext.imageSmoothingEnabled = false;
tableContext.imageSmoothingEnabled = false;
stateContext.imageSmoothingEnabled = false;
settingsContext.imageSmoothingEnabled = false;

// The size of a tile of the map on its canvas: the size of a tile in the images, so everything is drawn without scaling,
// at whole pixels. The browser scales the canvas to the page, see game.css.
const SQUARE = { width: viewParams.sourceTileSize, height: viewParams.sourceTileSize };
// The size of a digit of the points and the number of players. Their canvas doesn't change with the size of the map.
const DIGIT_SIZE = viewParams.sourceTileSize;

/**
 * Fits the canvases of the map and of the objects to a map of mapWidth × mapHeight tiles. A map of another size has
 * a canvas of another size, instead of tiles which don't fit the canvas into whole pixels: the edges of a tile at
 * fractional coordinates are blended with the transparent canvas, so a line of the page shows between the tiles.
 * The canvases are cleared, which is what setting their size does, even to the size they already have. The hero and
 * the dust of the previous game rely on that, so keep setting the size of the canvases for every game.
 */
function initSquareProportions(mapWidth, mapHeight) {
    for (const [canvas, context] of [
        [mapCanvas, mapContext],
        [objectCanvas, objectContext],
    ]) {
        canvas.width = mapWidth * SQUARE.width;
        canvas.height = mapHeight * SQUARE.height;
        // Setting the size of a canvas resets its context.
        context.imageSmoothingEnabled = false;
    }
}

/**
 * Calculates and returns the position on the canvas, where an image should be drew
 * (the coordinations of the top-left corner of the image).
 * @param position The game position of the drew image, in other words, the position on the map.
 * @returns The coordinations of the top-left corner of the image
 */
function calculateTargetOrigin(position) {
    return { x: position.x * SQUARE.width, y: position.y * SQUARE.height };
}

function calculatePointsTargetOrigin(characterIndex) {
    return { x: DIGIT_SIZE * (1 + characterIndex), y: DIGIT_SIZE };
}

function calculatePlayersTargetOrigin(characterIndex, digitsNumber) {
    return { x: stateCanvas.width + DIGIT_SIZE * (-1 - digitsNumber + characterIndex), y: DIGIT_SIZE };
}

function calculateInfoTextTargetOrigin(infoTextWidth, infoTextHeight) {
    return { x: (stateCanvas.width - infoTextWidth) / 2, y: (stateCanvas.height - infoTextHeight) / 2 };
}

export {
    initSquareProportions,
    mapCanvas,
    objectCanvas,
    filterCanvas,
    stateCanvas,
    settingsCanvas,
    mapContext,
    objectContext,
    filterContext,
    tableContext,
    stateContext,
    settingsContext,
    SQUARE,
    DIGIT_SIZE,
    calculateTargetOrigin,
    calculatePointsTargetOrigin,
    calculatePlayersTargetOrigin,
    calculateInfoTextTargetOrigin,
};
