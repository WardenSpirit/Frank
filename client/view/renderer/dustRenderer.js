import viewParams from '../viewParams.json' with { type: 'json' };
import * as dustParser from '../parser/dustParser.js';
import * as drawingContext from './drawingContext.js'
import * as images from '../images.js';


/**
 * Parameters, which are used for drawing the hero.
 */
const dustAnimationInterval = 150;

/**
 * Coordinations of animation "dusts", that use to be displayed behind the hero after he/she moves.
 */
let dusts = [];

export function addDust(dustyPosition) {
    dusts[dusts.length] = { position: dustyPosition, spawnTime: calculateSpawnTime(), phase: 0, toBeDrawn: true };
}

function calculateSpawnTime() {
    const currentTime = Date.now();
    if (dusts.length == 0) {
        return currentTime;
    } else {
        return Math.max(dusts[dusts.length - 1].spawnTime + dustAnimationInterval / dusts.length, currentTime);
    }
}

export function removeDust(cleanPosition) {
    removeStompedDust(cleanPosition);
}

function removeStompedDust(stompedPosition) {
    for (let i = dusts.length - 1; i >= 0; i--) {
        const dust = dusts[i];
        if (arePositionsSame(dust.position, stompedPosition)) {
            dusts.splice(i, 1);
            break;
        }
    }
}

/**
 * Tells whether the two arguments represent the same position in the game.
 * @param firstPosition The first position to compare with the other one.
 * @param secondPosition The other position to compare with the first one.
 * @returns True if the x and y coordinations of both specified positions are equal.
 */
function arePositionsSame(firstPosition, secondPosition) {
    return firstPosition.x == secondPosition.x && firstPosition.y == secondPosition.y;
}

export function startRenderingDust() {
    requestAnimationFrame(function animateDust() {
        updateDusts(Date.now());
        requestAnimationFrame(animateDust);
    });
}

function updateDusts(currentTime) {
    for (let i = 0; i < dusts.length; i++) {
        const dust = dusts[i];

        const oldPhase = dust.phase;
        dust.phase = Math.max(0, Math.floor((currentTime - dust.spawnTime) / dustAnimationInterval));

        if (oldPhase != dust.phase) {
            clearDust(dust);
        }
        if (dust.toBeDrawn) {
            drawDust(i);
        }
    }
}

function clearDust(dust) {
    const targetOrigin = drawingContext.calculateTargetOrigin(dust.position);
    drawingContext.objectContext.clearRect(targetOrigin.x, targetOrigin.y, drawingContext.square.width, drawingContext.square.height);
}

async function drawDust(i) {
    const dust = dusts[i];
    const sourceOrigin = dustParser.calculateDustSourceOrigin(dust);
    if (!sourceOrigin) {
        dusts.splice(i, 1);
        return;
    }
    const targetOrigin = drawingContext.calculateTargetOrigin(dust.position);
    const IMAGE = await images.getImage("DUST");
    drawingContext.objectContext.drawImage(IMAGE, sourceOrigin.x, sourceOrigin.y, viewParams.sourceTileSize, viewParams.sourceTileSize, targetOrigin.x, targetOrigin.y, drawingContext.square.width, drawingContext.square.height);
}