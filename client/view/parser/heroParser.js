import viewParams from '../viewParams.json' with { type: 'json' };
import * as images from '../images.js';

const STANDING_LINE = 0;
const WALK_UP_LINE = 1;
const WALK_RIGHT_LINE = 2;
const WALK_DOWN_LINE = 3;
const WALK_LEFT_LINE = 4;

const IMAGE = await images.getImage("HERO");
const HERO_COUNT = IMAGE.width / viewParams.sourceTileSize;

const HERO_ANIMATION_INTERVAL = 300;
let lastChangeTime = - HERO_ANIMATION_INTERVAL;
let lastSourceOrigin = { x: 0, y: 0 };

export function calculateHeroSourceOrigin(heroState, currentTime) {
    let x = lastSourceOrigin.x;
    let y;
    if (currentTime - lastChangeTime > HERO_ANIMATION_INTERVAL) {
        lastChangeTime = currentTime - currentTime % HERO_ANIMATION_INTERVAL;
        x = (x + viewParams.sourceTileSize) % (HERO_COUNT * viewParams.sourceTileSize);
    }
    switch (heroState) {
        case "UP":
            y = WALK_UP_LINE;
            break;
        case "RIGHT":
            y = WALK_RIGHT_LINE;
            break;
        case "DOWN":
            y = WALK_DOWN_LINE;
            break;
        case "LEFT":
            y = WALK_LEFT_LINE;
            break;
        default:        //case "STANDING":
            y = STANDING_LINE;
            break;
    }
    lastSourceOrigin.x = x;
    lastSourceOrigin.y = y;
    return lastSourceOrigin;
}