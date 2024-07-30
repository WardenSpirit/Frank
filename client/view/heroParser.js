import viewParams from './viewParams.json' with { type: 'json' };

const standingHeroLine = 0;
const walkUpHeroLine = 1;
const walkRightHeroLine = 2;
const walkDownHeroLine = 3;
const walkLeftHeroLine = 4;
const heroCount = 4;

const heroAnimationInterval = 300;
let lastChangeTime = - heroAnimationInterval;
let lastSourceOrigin = {x: 0, y: 0};

export function calculateHeroSourceOrigin(heroState, currentTime) {
    if (currentTime - lastChangeTime > heroAnimationInterval) {
        lastChangeTime = currentTime - currentTime % heroAnimationInterval;
        lastSourceOrigin.x = (lastSourceOrigin.x + viewParams.sourceTileSize) % (heroCount * viewParams.sourceTileSize);
    }
    let y;
    switch (heroState) {
        case "UP":
            y = walkUpHeroLine;
            break;
        case "RIGHT":
            y = walkRightHeroLine;
            break;
        case "DOWN":
            y = walkDownHeroLine;
            break;
        case "LEFT":
            y = walkLeftHeroLine;
            break;
        default:        //case "STANDING":
            y = standingHeroLine;
            break;
    }
    lastSourceOrigin.y = y;
    return lastSourceOrigin;
}