import protocol from "../../../shared/protocol.json" with { type: "json" };
import viewParams from "../viewParams.json" with { type: "json" };
import * as terrainParser from "../parser/terrainParser.js";
import * as drawingContext from "./drawingContext.js";
import * as images from "../images.js";

const { TERRAIN } = protocol;

/**
 * Draws the map with the images of the textures. Resolves when the whole map is drawn.
 */
export async function renderMap(map, textures) {
    const [pathImage, holeImage] = await Promise.all([
        images.getImage("PATH", textures),
        images.getImage("HOLE", textures),
    ]);

    drawingContext.mapContext.clearRect(0, 0, drawingContext.mapCanvas.width, drawingContext.mapCanvas.height);

    for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
            renderTerrain(map, { x: x, y: y }, pathImage, holeImage);
        }
    }
}

function renderTerrain(map, position, pathImage, holeImage) {
    let sourceOrigin;
    let image;
    if (map[position.x][position.y] === TERRAIN.PATH) {
        image = pathImage;
        sourceOrigin = terrainParser.getPathSource(pathImage);
    } else {
        image = holeImage;
        sourceOrigin = terrainParser.getHoleSource(map, position);
    }
    const targetOrigin = drawingContext.calculateTargetOrigin(position);
    drawingContext.mapContext.drawImage(
        image,
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
