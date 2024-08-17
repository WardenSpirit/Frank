import viewParams from '../viewParams.json' with { type: 'json' };
import * as heroParser from '../parser/heroParser.js';
import * as drawingContext from './drawingContext.js'
import * as images from '../images.js';

let heroTargetOrigin = { x: 0, y: 0 };

let targetOriginsToClear = [];
let oldHeroSourceOrigin = { x: 0, y: 0 };

let heroToRedraw = true;

let heroState = "STANDING";

export function setNewPosition(newHeroPosition) {
    targetOriginsToClear.push({ x: heroTargetOrigin.x, y: heroTargetOrigin.y });
    heroTargetOrigin = drawingContext.calculateTargetOrigin(newHeroPosition);
    heroToRedraw = true;
}

export function startRenderingHero() {
    requestAnimationFrame(function animateHero(currentTime) {
        let heroSourceOrigin = heroParser.calculateHeroSourceOrigin(heroState, currentTime);
        const sourceChanged = heroSourceOrigin.x != oldHeroSourceOrigin.x || heroSourceOrigin.y != oldHeroSourceOrigin.y;
        if (sourceChanged) {
            targetOriginsToClear.push({ x: heroTargetOrigin.x, y: heroTargetOrigin.y });
            heroToRedraw = true;
        }
        if (heroToRedraw) {
            oldHeroSourceOrigin.x = heroSourceOrigin.x;
            oldHeroSourceOrigin.y = heroSourceOrigin.y;
            clearHero(targetOriginsToClear);
            drawHero(heroSourceOrigin, heroTargetOrigin);
            heroToRedraw = false;
        }
        requestAnimationFrame(animateHero);
    });
}

//the hero vanishes when spawned because this is called on the last positions visited in the last game
function clearHero(targetOriginsToClear) {
    while(targetOriginsToClear.length > 0) {
        const targetOriginToClear = targetOriginsToClear.shift(0, 1);
        drawingContext.objectContext.clearRect(targetOriginToClear.x, targetOriginToClear.y, drawingContext.SQUARE.width, drawingContext.SQUARE.height);
    }
}

async function drawHero(heroSourceOrigin, heroTargetOrigin) {
    const IMAGE = await images.getImage("HERO");
    drawingContext.objectContext.drawImage(IMAGE, heroSourceOrigin.x, heroSourceOrigin.y, viewParams.sourceTileSize, viewParams.sourceTileSize, heroTargetOrigin.x, heroTargetOrigin.y, drawingContext.SQUARE.width, drawingContext.SQUARE.height);
}