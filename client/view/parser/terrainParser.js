import protocol from "../../../shared/protocol.json" with { type: "json" };
import * as generalTileParser from "./generalTileParser.js";

const { TERRAIN } = protocol;

/**
 * Returns the source origin of a random path tile of the sprite sheet.
 */
function getPathSource(pathImage) {
    return getPathOrigin(generalTileParser.getTileCountInLine(pathImage));
}

function getHoleSource(map, position) {
    // surroundings – a 3×3 array should be read around the position – with values 0 and 1 (and 'undefined's at the borders) indicating grass and water tiles around. The middle ([1][1]) is the surrounded tile.
    let sourceOrigin;
    sourceOrigin = getHoleOrigin(map, position);
    return sourceOrigin;
}

function getPathOrigin(pathCount) {
    return generalTileParser.getRandomOriginInLine(0, pathCount);
}

function getHoleOrigin(map, position) {
    let surroundings = getSurroundings(map, position);
    return generalTileParser.getTileSourceOrigin(getSourceLine(surroundings), getSourceColumn(surroundings));
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
    if (
        position.x + shiftX < 0 ||
        position.x + shiftX >= map.length ||
        position.y + shiftY < 0 ||
        position.y + shiftY >= map[0].length
    ) {
        return false;
    }
    return map[position.x + shiftX][position.y + shiftY] === TERRAIN.HOLE;
}

function getSourceColumn(surroundings) {
    let column = 0;
    for (let i = 3; i >= 0; i--) {
        column *= 2;
        if (surroundings[i]) {
            column++;
        }
    }
    return column;
}

function getSourceLine(surroundings) {
    let line = 0;
    for (let i = 3; i >= 0; i--) {
        line *= 2;
        if (surroundings[i + 4] && (surroundings[i] || surroundings[(i + 1) % 4])) {
            line++;
        }
    }
    return line;
}

export { getPathSource, getHoleSource };
