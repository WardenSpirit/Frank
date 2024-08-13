import * as images from '../images.js';
import * as generalTileParser from './generalTileParser.js';
import viewParams from '../viewParams.json' with { type: 'json' };

const IMAGE = await images.getImage("TREASURE");
const treasureCount = IMAGE.width / viewParams.sourceTileSize;


export function getTreasureSource() {
    return (0, generalTileParser.getTileSourceOrigin(0, treasureCount - 1));
}