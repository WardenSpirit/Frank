import viewParams from '../viewParams.json' with { type: 'json' };

function getRandomOriginInLine(line, tileCount) {
    return getTileSourceOrigin(line, Math.floor(Math.random() * tileCount));
}

function getTileSourceOrigin(row, column) {
    return {
        x: column * viewParams.sourceTileSize,
        y: row * viewParams.sourceTileSize
    };
}

export { getRandomOriginInLine, getTileSourceOrigin };