import protocol from "../../../shared/protocol.json" with { type: "json" };
import viewParams from "../viewParams.json" with { type: "json" };
import * as generalTileParser from "./generalTileParser.js";

const { DIRECTION } = protocol;

export const STANDING = "STANDING";

const STANDING_LINE = 0;
const WALK_UP_LINE = 1;
const WALK_RIGHT_LINE = 2;
const WALK_DOWN_LINE = 3;
const WALK_LEFT_LINE = 4;

const HERO_ANIMATION_INTERVAL = 300;
let lastChangeTime = -HERO_ANIMATION_INTERVAL;
let lastSourceOrigin = { x: 0, y: 0 };

/**
 * @param heroState STANDING or a direction the hero is turned to.
 * @param currentTime The time of the animation frame.
 * @param heroImage The sprite sheet of the hero. Its width gives the number of the frames, which can differ between
 *     the sheets of the texture sets.
 */
export function calculateHeroSourceOrigin(heroState, currentTime, heroImage) {
    const heroCount = generalTileParser.getTileCountInLine(heroImage);
    const sheetWidth = heroCount * viewParams.sourceTileSize;
    // The frame is kept between the games, so it can lie behind the end of a narrower sheet of the next game. Wrapping
    // it here continues the animation without waiting for the next change of the frame.
    let x = lastSourceOrigin.x % sheetWidth;
    let y;
    if (currentTime - lastChangeTime > HERO_ANIMATION_INTERVAL) {
        lastChangeTime = currentTime - (currentTime % HERO_ANIMATION_INTERVAL);
        x = (x + viewParams.sourceTileSize) % sheetWidth;
    }
    switch (heroState) {
        case DIRECTION.UP:
            y = WALK_UP_LINE;
            break;
        case DIRECTION.RIGHT:
            y = WALK_RIGHT_LINE;
            break;
        case DIRECTION.DOWN:
            y = WALK_DOWN_LINE;
            break;
        case DIRECTION.LEFT:
            y = WALK_LEFT_LINE;
            break;
        case STANDING:
            y = STANDING_LINE;
            break;
        default:
            throw new Error(`Unknown hero state: ${heroState}`);
    }
    lastSourceOrigin.x = x;
    lastSourceOrigin.y = y * viewParams.sourceTileSize;
    return lastSourceOrigin;
}
