import viewParams from '../viewParams.json' with { type: 'json' };
import * as generalParser from './generalParser.js';
import * as images from '../images.js';

/**
 * Parameters which are used when calculating the correct part of picture source. That part is then drew on the canvases.
 */
const IMAGE = await images.getImage("PATH");
const PATH_COUNT = IMAGE.width / viewParams.sourceTileSize;

/**
 * Returns an Image object for the tile regarding to the passed surrounding terrain.
 */
function getPathSource(map, position) {        // surroundings – a 3×3 array should be read around the position – with values 0 and 1 (and 'undefined's at the borders) indicating grass and water tiles around. The middle ([1][1]) is the surrounded tile.
    let sourceOrigin;
    sourceOrigin = getPathOrigin();
    return sourceOrigin;
}

function getHoleSource(map, position) {        // surroundings – a 3×3 array should be read around the position – with values 0 and 1 (and 'undefined's at the borders) indicating grass and water tiles around. The middle ([1][1]) is the surrounded tile.
    let sourceOrigin;
    sourceOrigin = getHoleOrigin(map, position);
    return sourceOrigin;
}

function getPathOrigin() {
    return generalParser.getRandomOriginInLine(0, PATH_COUNT);
}

function getHoleOrigin(map, position) {
    let surroundings = getSurroundings(map, position);
    return generalParser.getOriginInLine(getSourceLine(surroundings), getSourceColumn(surroundings));
}

function getSurroundings(map, position) {
    const surroundings = [];

    surroundings.push(getSurrounding(position, 0, -1, map));
    surroundings.push(getSurrounding(position, 1, 0, map));
    surroundings.push(getSurrounding(position, 0, 1, map));
    surroundings.push(getSurrounding(position, -1, 0, map));
    surroundings.push(getSurrounding(position, 1, -1, map));
    surroundings.push(getSurrounding(position, 1, 1, map));
    surroundings.push(getSurrounding(position, -1, 1, map));
    surroundings.push(getSurrounding(position, -1, -1, map));

    return surroundings;
}

function getSurrounding(position, shiftX, shiftY, map) {
    if (position.x + shiftX < 0 || position.x + shiftX >= map.length ||
        position.y + shiftY < 0 || position.y + shiftY >= map[0].length) {
        return 0;
    }
    return map[position.x + shiftX][position.y + shiftY];
}

function getSourceColumn(surroundings) {
    let column = 0;
    for (let i = 3; i >= 0; i--) {
        const surrounding = surroundings[i];
        column *= 2;
        column += surrounding;
    }
    return column;
}

function getSourceLine(surroundings) {
    let line = 0;
    for (let i = 3; i >= 0; i--) {
        line *= 2;
        if (surroundings[i + 4] && (surroundings[i] == 1 || surroundings[(i + 1) % 4] == 1)) {
            line++;
        }
    }
    return line;
}

export { getPathSource, getHoleSource };