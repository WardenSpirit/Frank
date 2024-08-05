import * as images from '../images.js';
import * as parserUtils from './parserUtils.js';
import viewParams from '../viewParams.json' with { type: 'json' };

const treasureCount = images.treasureImage.width / viewParams.sourceTileSize;


export function getTreasureSource() {
    return parserUtils.getRandomOriginInLine(0, treasureCount);
}