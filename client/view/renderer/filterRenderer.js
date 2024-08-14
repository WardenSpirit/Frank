import viewParams from '../viewParams.json' with { type: 'json' };
import * as drawingContext from "./drawingContext.js";
import * as images from '../images.js';

const GOOD_IMAGE = await images.getImage("GOOD_FILTER");
const BAD_IMAGE = await images.getImage("BAD_FILTER");

const FILTER_SIZE = viewParams.sourceTileSize * 14;
const GOOD_FILTER_COUNT = GOOD_IMAGE.width / FILTER_SIZE;
const BAD_FILTER_COUNT = BAD_IMAGE.width / FILTER_SIZE;

const TARGET_ORIGIN = { x: 0, y: 0 };
const TARGET_SIZE = { width: drawingContext.filterCanvas.width, height: drawingContext.filterCanvas.height };

const FILTER_ANIMATION_INTERVAL = 800;
let drawingTime;

export async function displayFilter(isGood) {
    const IMAGE = isGood ? GOOD_IMAGE : BAD_IMAGE;
    const SOURCE_ORIGIN = { x: 0, y: 0 };
    const SOURCE_SIZE = { width: FILTER_SIZE, height: FILTER_SIZE };

    drawingTime = performance.now();
    drawingContext.filterContext.drawImage(
        IMAGE,
        SOURCE_ORIGIN.x, SOURCE_ORIGIN.y,
        SOURCE_SIZE.width, SOURCE_SIZE.height,
        TARGET_ORIGIN.x, TARGET_ORIGIN.y,
        TARGET_SIZE.width, TARGET_SIZE.height);

    waitToClear();
}

function waitToClear() {
    requestAnimationFrame(function checkToClear(currentTime) {
        if (currentTime >= drawingTime + FILTER_ANIMATION_INTERVAL) {
            drawingContext.filterContext.clearRect(
                TARGET_ORIGIN.x, TARGET_ORIGIN.y,
                TARGET_SIZE.width, TARGET_SIZE.height);
        } else {
            requestAnimationFrame(checkToClear);
        }
    })
}