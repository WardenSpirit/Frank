import params from '../../params.json' with {type: 'json'};
import viewParams from '../viewParams.json' with { type: 'json' };
import * as terrainParser from '../parser/terrainParser.js';
import * as drawingContext from './drawingContext.js'
import * as images from '../images.js';


export async function renderMap(map) {
    drawingContext.gameContext.clearRect(0, 0, drawingContext.gameCanvas.width, drawingContext.gameCanvas.height);

    for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
            renderTerrain(map, { x: x, y: y });
        }
    }
}

async function renderTerrain(map, position) {
    let sourceOrigin;
    let image;
    if (map[position.x][position.y] == params.PATH_CODE) {
        image = await images.getImage("PATH");
        sourceOrigin = terrainParser.getPathSource(map, position);
    } else {
        image = await images.getImage("HOLE");
        sourceOrigin = terrainParser.getHoleSource(map, position);
    }
    const targetOrigin = drawingContext.calculateTargetOrigin(position);
    drawingContext.gameContext.drawImage(image,
        sourceOrigin.x,
        sourceOrigin.y,
        viewParams.sourceTileSize,
        viewParams.sourceTileSize,
        targetOrigin.x,
        targetOrigin.y,
        drawingContext.square.width,
        drawingContext.square.height);
}