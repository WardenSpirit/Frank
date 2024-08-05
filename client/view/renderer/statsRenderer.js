import viewParams from '../viewParams.json' with { type: 'json' };
import * as drawingContext from './drawingContext.js';
import * as numberParser from '../parser/numberParser.js';
import * as images from '../images.js';

let oldTargetOrigins = [];

export function renderScore(points) {
    clearScore();

    let sourceOrigins = numberParser.getDigitsOrigins(points);
    let targetOrigins = Array.from({ length: sourceOrigins.length }, (_v, i) => drawingContext.calculateStatsTargetOrigin(i));

    drawScore(sourceOrigins, targetOrigins);

    oldTargetOrigins = targetOrigins;
}

function clearScore() {
    for (let i = 0; i < oldTargetOrigins.length; i++) {
        const oldTargetOrigin = oldTargetOrigins[i];
        drawingContext.stateContext.clearRect(
            oldTargetOrigin.x,
            oldTargetOrigin.y,
            drawingContext.square.width,
            drawingContext.square.height);
    }
}
function drawScore(sourceOrigins, targetOrigins) {
    for (let i = 0; i < sourceOrigins.length; i++) {
        const sourceOrigin = sourceOrigins[i];
        const targetOrigin = targetOrigins[i];

        drawingContext.stateContext.drawImage(images.digitsImage,
            sourceOrigin.x,
            sourceOrigin.y,
            viewParams.sourceTileSize,
            viewParams.sourceTileSize,
            targetOrigin.x,
            targetOrigin.y,
            drawingContext.square.width,
            drawingContext.square.height);
    }
}