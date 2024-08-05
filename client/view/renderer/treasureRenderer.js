import viewParams from '../viewParams.json' with { type: 'json' };
import * as treasureParser from '../parser/treasureParser.js';
import * as drawingContext from './drawingContext.js';
import * as images from '../images.js';

export function renderTreasure(position) {
    const sourceOrigin = treasureParser.getTreasureSource();
    const targetOrigin = drawingContext.calculateTargetOrigin(position);
    drawingContext.gameContext.drawImage(images.treasureImage, sourceOrigin.x, sourceOrigin.y, viewParams.sourceTileSize, viewParams.sourceTileSize, targetOrigin.x, targetOrigin.y, drawingContext.square.width, drawingContext.square.height);
}