import * as drawingContext from "./drawingContext.js";
import * as images from "../images.js";
import {
    drawBitmapText,
    measureBitmapText
} from "./bitmapTextRenderer.js";

const IMAGE = await images.getImage("CHARACTERS");
const CANVAS_WIDTH_FACTOR = drawingContext.stateCanvas.width / (14 * 16);
const CANVAS_HEIGHT_FACTOR = drawingContext.stateCanvas.height / 47;
const CHAR_TARGET_HEIGHT = CANVAS_HEIGHT_FACTOR * IMAGE.height;

let infoTextTargetOrigin;
let infoTextTargetWidth;

export function renderInfoText(text) {
    const sourceWidth = measureBitmapText(text);

    infoTextTargetWidth = sourceWidth * CANVAS_WIDTH_FACTOR;

    infoTextTargetOrigin = drawingContext.calculateInfoTextTargetOrigin(
        infoTextTargetWidth,
        CHAR_TARGET_HEIGHT
    );

    drawBitmapText(
        drawingContext.stateContext,
        IMAGE,
        text,
        infoTextTargetOrigin.x,
        infoTextTargetOrigin.y,
        CANVAS_WIDTH_FACTOR,
        CANVAS_HEIGHT_FACTOR
    );
}

export function clearInfoText() {
    if (infoTextTargetOrigin === undefined) {
        return;
    }

    drawingContext.stateContext.clearRect(
        infoTextTargetOrigin.x,
        infoTextTargetOrigin.y,
        infoTextTargetWidth,
        CHAR_TARGET_HEIGHT
    );
}