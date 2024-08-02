import params from '../../params.json' with {type: 'json'};
import * as parserUtils from './parserUtils.js';

/**
 * Parameters which are used when calculating the correct part of picture source. That part is then drew on the canvases.
 */
const grassLine = 0;
const maskForWaterLine = 1;
const waterLine = 2;
const grassCount = 8;
const maskForWaterCount = 4;
const waterCount = 4;

/**
 * Returns an Image object for the tile regarding to the passed surrounding terrain.
 */
function getTerrainSource(map, position) {        // surroundings – a 3×3 array should be read around the position – with values 0 and 1 (and 'undefined's at the borders) indicating grass and water tiles around. The middle ([1][1]) is the surrounded tile.
    let sourceOrigin;
    if (map[position.x][position.y] == params.GRASS_CODE) {
        sourceOrigin = getGrassOrigin();
    } else {
        sourceOrigin = getWaterOrigin();
    }
    return sourceOrigin;
}

function getGrassOrigin() {
    return parserUtils.getRandomOriginInLine(grassLine, grassCount);
}

function getWaterOrigin() {
    const base = parserUtils.getRandomOriginInLine(waterLine, waterCount);
    const mask = parserUtils.getRandomOriginInLine(maskForWaterLine, maskForWaterCount);

    return base;
    //return sum(base, mask);
}

export { getTerrainSource };