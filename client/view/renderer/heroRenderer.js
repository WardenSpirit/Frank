import viewParams from '../viewParams.json' with { type: 'json' };
import * as heroParser from '../parser/heroParser.js';
import * as drawingContext from './drawingContext.js'
import * as images from '../images.js';

let heroTargetOrigin = { x: 0, y: 0 };
let oldHeroTargetOrigin;
let oldHeroSourceOrigin = { x: 0, y: 0 };

let heroToRedraw = true;

let heroState = "STANDING";

export function setNewPosition(newHeroPosition) {
    oldHeroTargetOrigin = { x: heroTargetOrigin.x, y: heroTargetOrigin.y };     //copy?
    heroTargetOrigin = drawingContext.calculateTargetOrigin(newHeroPosition);
    heroToRedraw = true;
}

export function startRenderingHero() {
    requestAnimationFrame(function animateHero(currentTime) {
        let heroSourceOrigin = heroParser.calculateHeroSourceOrigin(heroState, currentTime);
        heroToRedraw = heroToRedraw || (heroSourceOrigin.x != oldHeroSourceOrigin.x || heroSourceOrigin.y != oldHeroSourceOrigin.y);
        if (heroToRedraw) {
            clearHero(oldHeroTargetOrigin);
            drawHero(heroSourceOrigin, heroTargetOrigin);
            heroToRedraw = false;
            oldHeroSourceOrigin.x = heroSourceOrigin.x;
            oldHeroSourceOrigin.y = heroSourceOrigin.y;
            oldHeroTargetOrigin.x = heroTargetOrigin.x;
            oldHeroTargetOrigin.y = heroTargetOrigin.y;
        }
        requestAnimationFrame(animateHero);
    });
}

function clearHero(heroTargetOrigin) {
    drawingContext.objectContext.clearRect(heroTargetOrigin.x, heroTargetOrigin.y, drawingContext.square.width, drawingContext.square.height);
}

function drawHero(heroSourceOrigin, heroTargetOrigin) {
    drawingContext.objectContext.drawImage(images.heroImage, heroSourceOrigin.x, heroSourceOrigin.y, viewParams.sourceTileSize, viewParams.sourceTileSize, heroTargetOrigin.x, heroTargetOrigin.y, drawingContext.square.width, drawingContext.square.height);
}