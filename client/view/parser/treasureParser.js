import * as generalTileParser from "./generalTileParser.js";

/**
 * @param treasureImage The sprite sheet of the treasure.
 */
export function getTreasureSource(treasureImage) {
    return generalTileParser.getTileSourceOrigin(0, generalTileParser.getTileCountInLine(treasureImage) - 1);
}
