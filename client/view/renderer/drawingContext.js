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

let square;

function initSquareProportions(mapWidth, mapHeight) {
    square = {
        width: gameCanvas.width / mapWidth,
        height: gameCanvas.height / mapHeight
    }
}

/**
 * Calculates and returns the position on the canvas, where an image should be drew
 * (the coordinations of the top-left corner of the image).
 * @param position The game position of the drew image, in other words, the position on the map.
 * @returns The coordinations of the top-left corner of the image
 */
function calculateTargetOrigin(position) {
    return { x: position.x * square.width, y: position.y * square.height };
}

function calculatePointsTargetOrigin(characterIndex) {
    return { x: square.width * (1 + characterIndex), y: square.width * 5 / 4 };
}

function calculatePlayersTargetOrigin(characterIndex, digitsNumber) {
    return { x: stateCanvas.width + square.width * (-1 - digitsNumber + characterIndex), y: square.width * 5 / 4 };
}

export {initSquareProportions, gameCanvas, heroCanvas, gameContext, objectContext, tableContext, stateContext, square,
    calculateTargetOrigin, calculatePointsTargetOrigin, calculatePlayersTargetOrigin}