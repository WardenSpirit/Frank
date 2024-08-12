import * as images from '../images.js';
import * as generalParser from './generalParser.js';
import viewParams from '../viewParams.json' with { type: 'json' };

const IMAGE = await images.getImage("TREASURE");
const treasureCount = IMAGE.width / viewParams.sourceTileSize;


export function getTreasureSource() {
    return (0, generalParser.getTileSourceOrigin(0, treasureCount - 1));
}