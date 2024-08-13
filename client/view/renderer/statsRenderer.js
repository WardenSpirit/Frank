import viewParams from '../viewParams.json' with { type: 'json' };
import * as drawingContext from './drawingContext.js';
import * as numberParser from '../parser/numberParser.js';
import * as images from '../images.js';

const IMAGE = await images.getImage("DIGITS");

let oldPointsTargetOrigins = [];
let oldPlayersTargetOrigins = [];

export function renderPoints(points) {
    clearPoints();

    let sourceOrigins = numberParser.getDigitsOrigins(points);
    let targetOrigins = Array.from({ length: sourceOrigins.length }, (_v, i) => drawingContext.calculatePointsTargetOrigin(i));

    drawDigits(sourceOrigins, targetOrigins);

    oldPointsTargetOrigins = targetOrigins;
}

function clearPoints() {
    for (let i = 0; i < oldPointsTargetOrigins.length; i++) {
        const oldTargetOrigin = oldPointsTargetOrigins[i];
        drawingContext.stateContext.clearRect(
            oldTargetOrigin.x,
            oldTargetOrigin.y,
            drawingContext.SQUARE.width,
            drawingContext.SQUARE.height);
    }
}

function drawDigits(sourceOrigins, targetOrigins) {
    for (let i = 0; i < sourceOrigins.length; i++) {
        const sourceOrigin = sourceOrigins[i];
        const targetOrigin = targetOrigins[i];

        drawingContext.stateContext.drawImage(IMAGE,
            sourceOrigin.x,
            sourceOrigin.y,
            viewParams.sourceTileSize,
            viewParams.sourceTileSize,
            targetOrigin.x,
            targetOrigin.y,
            drawingContext.SQUARE.width,
            drawingContext.SQUARE.height);
    }
}

export function renderPlayers(players) {
    clearPlayers();

    let sourceOrigins = numberParser.getDigitsOrigins(players);
    let targetOrigins = Array.from({ length: sourceOrigins.length }, (_v, i) => drawingContext.calculatePlayersTargetOrigin(i, sourceOrigins.length));

    drawDigits(sourceOrigins, targetOrigins);

    oldPlayersTargetOrigins = targetOrigins;
}

function clearPlayers() {
    for (let i = 0; i < oldPlayersTargetOrigins.length; i++) {
        const oldTargetOrigin = oldPlayersTargetOrigins[i];
        drawingContext.stateContext.clearRect(
            oldTargetOrigin.x,
            oldTargetOrigin.y,
            drawingContext.SQUARE.width,
            drawingContext.SQUARE.height);
    }
}