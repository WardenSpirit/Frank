import viewParams from "../viewParams.json" with { type: "json" };
import * as treasureParser from "../parser/treasureParser.js";
import * as drawingContext from "./drawingContext.js";
import * as images from "../images.js";

export async function renderTreasure(position, textures) {
    const IMAGE = await images.getImage("TREASURE", textures);
    const sourceOrigin = treasureParser.getTreasureSource(IMAGE);
    const targetOrigin = drawingContext.calculateTargetOrigin(position);

    drawingContext.mapContext.drawImage(
        IMAGE,
        sourceOrigin.x,
        sourceOrigin.y,
        viewParams.sourceTileSize,
        viewParams.sourceTileSize,
        targetOrigin.x,
        targetOrigin.y,
        drawingContext.SQUARE.width,
        drawingContext.SQUARE.height,
    );
}
