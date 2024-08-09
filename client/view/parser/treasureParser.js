import * as images from '../images.js';
import * as parserUtils from './parserUtils.js';
import viewParams from '../viewParams.json' with { type: 'json' };

const IMAGE = await images.getImage("TREASURE");
const treasureCount = IMAGE.width / viewParams.sourceTileSize;


export function getTreasureSource() {
    return parserUtils.getRandomOriginInLine(0, treasureCount);
}