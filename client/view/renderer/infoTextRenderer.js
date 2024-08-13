import * as drawingContext from './drawingContext.js';
import * as charParser from '../parser/charParser.js';
import * as images from '../images.js';


const IMAGE = await images.getImage("CHARACTERS");
const CANVAS_WIDTH_FACTOR = drawingContext.stateCanvas.width / (14 * 16);
const CANVAS_HEIGHT_FACTOR = drawingContext.stateCanvas.height / (47);
const CHAR_SOURCE_HEIGHT = IMAGE.height;
const CHAR_TARGET_HEIGHT = CANVAS_HEIGHT_FACTOR * CHAR_SOURCE_HEIGHT;
let infoTextTargetOrigin;
let infoTextTargetWidth;


export function renderInfoText(text) {
    let sourceOrigins = charParser.getCharsOrigins(text);
    let sourceWidths = getCharsWidths(text);
    
    infoTextTargetWidth = sourceWidths.reduce((accumulator, currentValue) => accumulator + currentValue, 0) * CANVAS_WIDTH_FACTOR;
    infoTextTargetOrigin = drawingContext.calculateInfoTextTargetOrigin(infoTextTargetWidth, CHAR_TARGET_HEIGHT);

    const TARGET_ORIGINS = getTargetOrigins(infoTextTargetOrigin, sourceWidths);
    const TARGET_WIDTHS = sourceWidths.map(sourceWidth => CANVAS_WIDTH_FACTOR * sourceWidth);

    drawChars(sourceOrigins, sourceWidths, TARGET_ORIGINS, TARGET_WIDTHS);
}

function getCharsWidths(text) {
    return Array.from({ length: text.length}, (_v, i) => images.charsToWidths.get(text[i]));
}

function getTargetOrigins(infoTextTargetOrigin, sourceWidths) {
    const TARGET_ORIGINS = [];
    let targetShiftX = 0;
    for (let i = 0; i < sourceWidths.length; i++) {
        const SOURCE_WIDTH = sourceWidths[i];
        TARGET_ORIGINS.push({ x: infoTextTargetOrigin.x + targetShiftX, y: infoTextTargetOrigin.y });
        targetShiftX += CANVAS_WIDTH_FACTOR * SOURCE_WIDTH;
    }
    return TARGET_ORIGINS;
}

export function clearInfoText() {
    if (infoTextTargetOrigin === undefined) {
        return;
    }

    drawingContext.stateContext.clearRect(
        infoTextTargetOrigin.x,
        infoTextTargetOrigin.y,
        infoTextTargetWidth,
        CHAR_TARGET_HEIGHT);
}

function drawChars(sourceOrigins, sourceWidths, targetOrigins, targetWidths) {
    for (let i = 0; i < sourceOrigins.length; i++) {    //use infoTextTargetWidth and clear only one big rectangle over the entire text
        const SOURCE_ORIGIN = sourceOrigins[i];
        const TARGET_ORIGIN = targetOrigins[i];
        const SOURCE_WIDTH = sourceWidths[i];
        const TARGET_WIDTH = targetWidths[i];

        drawingContext.stateContext.drawImage(IMAGE,
            SOURCE_ORIGIN.x,
            SOURCE_ORIGIN.y,
            SOURCE_WIDTH,
            CHAR_SOURCE_HEIGHT,
            TARGET_ORIGIN.x,
            TARGET_ORIGIN.y,
            TARGET_WIDTH,
            CHAR_TARGET_HEIGHT);
    }
}