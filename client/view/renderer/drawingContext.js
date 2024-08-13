/**
 * Canvases and context configuration settings.
 */
const gameCanvas = document.querySelector("#game");
const heroCanvas = document.querySelector("#hero");
const tableCanvas = document.querySelector("#table");
const stateCanvas = document.querySelector("#stats");

const gameContext = gameCanvas.getContext("2d");
const objectContext = heroCanvas.getContext("2d");
const tableContext = tableCanvas.getContext("2d");
const stateContext = stateCanvas.getContext("2d");

gameContext.imageSmoothingEnabled = false;
objectContext.imageSmoothingEnabled = false;
tableContext.imageSmoothingEnabled = false;
stateContext.imageSmoothingEnabled = false;

const SQUARE = {
        width: 1,
        height: 1
}

function initSquareProportions(mapWidth, mapHeight) {
    SQUARE.width = gameCanvas.width / mapWidth;
    SQUARE.height = gameCanvas.height / mapHeight;
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
    return { x: SQUARE.width * (1 + characterIndex), y: SQUARE.width * 5 / 4 };
}

function calculatePlayersTargetOrigin(characterIndex, digitsNumber) {
    return { x: stateCanvas.width + SQUARE.width * (-1 - digitsNumber + characterIndex), y: SQUARE.width * 5 / 4 };
}

function calculateInfoTextTargetOrigin(infoTextWidth, infoTextHeight) {
    return { x: (stateCanvas.width - infoTextWidth) / 2,
        y: (stateCanvas.height - infoTextHeight) / 2};
}

export {initSquareProportions, gameCanvas, heroCanvas, stateCanvas, gameContext, objectContext, tableContext, stateContext, SQUARE,
    calculateTargetOrigin, calculatePointsTargetOrigin, calculatePlayersTargetOrigin, calculateInfoTextTargetOrigin}