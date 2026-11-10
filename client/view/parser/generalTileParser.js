import viewParams from "../viewParams.json" with { type: "json" };

function getRandomOriginInLine(line, tileCount) {
    return getTileSourceOrigin(line, Math.floor(Math.random() * tileCount));
}

function getTileSourceOrigin(row, column) {
    return {
        x: column * viewParams.sourceTileSize,
        y: row * viewParams.sourceTileSize,
    };
}

/**
 * Returns the number of tiles in a line of the sprite sheet.
 */
function getTileCountInLine(image) {
    return image.width / viewParams.sourceTileSize;
}

export { getRandomOriginInLine, getTileSourceOrigin, getTileCountInLine };
