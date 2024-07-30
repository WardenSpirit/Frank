import viewParams from './viewParams.json' with { type: 'json' };

function getRandomOriginInLine(line, tileCount) {
    return getOriginInLine(line, Math.floor(Math.random() * tileCount));
}

function getOriginInLine(line, tile) {
    return {
        x: tile * viewParams.sourceTileSize,
        y: line * viewParams.sourceTileSize
    };
}

export { getRandomOriginInLine };