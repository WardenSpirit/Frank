import viewParams from '../viewParams.json' with { type: 'json' };
import * as parserUtils from './parserUtils.js';
import * as images from '../images.js';

/**
 * Parameters which are used when calculating the correct part of picture source. That part is then drew on the canvases.
 */
const PATH_COUNT = images.pathImage.width / viewParams.sourceTileSize;
const HOLE_COUNT = images.holeImage.width / viewParams.sourceTileSize;

/**
 * Returns an Image object for the tile regarding to the passed surrounding terrain.
 */
function getPathSource(map, position) {        // surroundings – a 3×3 array should be read around the position – with values 0 and 1 (and 'undefined's at the borders) indicating grass and water tiles around. The middle ([1][1]) is the surrounded tile.
    let sourceOrigin;
    sourceOrigin = getGrassOrigin();
    return sourceOrigin;
}

function getHoleSource(map, position) {        // surroundings – a 3×3 array should be read around the position – with values 0 and 1 (and 'undefined's at the borders) indicating grass and water tiles around. The middle ([1][1]) is the surrounded tile.
    let sourceOrigin;
    sourceOrigin = getHoleOrigin(map, position);
    return sourceOrigin;
}

function getGrassOrigin() {
    return parserUtils.getRandomOriginInLine(0, PATH_COUNT);
}

function getHoleOrigin(map, position) {
    return parserUtils.getRandomOriginInLine(0, HOLE_COUNT);
}

export { getPathSource, getHoleSource };