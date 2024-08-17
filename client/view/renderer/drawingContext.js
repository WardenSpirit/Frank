/**
 * Canvases and context configuration settings.
 */
const mapCanvas = document.querySelector("#game");
const objectCanvas = document.querySelector("#hero");
const filterCanvas = document.querySelector("#filter");
const tableCanvas = document.querySelector("#table");
const stateCanvas = document.querySelector("#stats");

const mapContext = mapCanvas.getContext("2d");
const objectContext = objectCanvas.getContext("2d");
const filterContext = filterCanvas.getContext("2d");
const tableContext = tableCanvas.getContext("2d");
const stateContext = stateCanvas.getContext("2d");

mapContext.imageSmoothingEnabled = false;
objectContext.imageSmoothingEnabled = false;
filterContext.imageSmoothingEnabled = false;
tableContext.imageSmoothingEnabled = false;
stateContext.imageSmoothingEnabled = false;

const SQUARE = {};

function initSquareProportions(mapWidth, mapHeight) {
    SQUARE.width = mapCanvas.width / mapWidth;
    SQUARE.height = mapCanvas.height / mapHeight;
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
    return { x: SQUARE.width * (1 + characterIndex), y: SQUARE.width};
}

function calculatePlayersTargetOrigin(characterIndex, digitsNumber) {
    return { x: stateCanvas.width + SQUARE.width * (-1 - digitsNumber + characterIndex), y: SQUARE.width};
}

function calculateInfoTextTargetOrigin(infoTextWidth, infoTextHeight) {
    return { x: (stateCanvas.width - infoTextWidth) / 2,
        y: (stateCanvas.height - infoTextHeight) / 2};
}

export {initSquareProportions, mapCanvas as gameCanvas, objectCanvas as heroCanvas, filterCanvas, stateCanvas,
    mapContext as gameContext, objectContext, filterContext, tableContext, stateContext, SQUARE,
    calculateTargetOrigin, calculatePointsTargetOrigin, calculatePlayersTargetOrigin, calculateInfoTextTargetOrigin}