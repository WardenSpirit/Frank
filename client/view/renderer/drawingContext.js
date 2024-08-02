/**
 * Canvases and context configuration settings.
 */
const gameCanvas = document.querySelector("#game");
const heroCanvas = document.querySelector("#hero");

const gameContext = gameCanvas.getContext("2d");
console.log("gameContext initialized");
const objectContext = heroCanvas.getContext("2d");

gameContext.imageSmoothingEnabled = false;
objectContext.imageSmoothingEnabled = false;

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


export {initSquareProportions, gameCanvas, heroCanvas, gameContext, objectContext, square, calculateTargetOrigin}