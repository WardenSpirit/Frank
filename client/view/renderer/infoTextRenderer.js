import viewParams from '../viewParams.json' with { type: 'json' };
import * as drawingContext from './drawingContext.js';
import * as numberParser from '../parser/numberParser.js';
import * as images from '../images.js';


export function renderInfoText(text) {
    clearInfoText();

    let sourceOrigins = textParser.getCharsOrigins(text);
    let targetOrigins = Array.from({ length: sourceOrigins.length }, (_v, i) => drawingContext.getTextTargetOrigin(text, i));

    drawDigits(sourceOrigins, targetOrigins);

    oldPointsTargetOrigins = targetOrigins;
}