import viewParams from '../viewParams.json' with { type: 'json' };

const dustLine = 0;


export function calculateDustSourceOrigin(phase) {
    return {
        x: phase * viewParams.sourceTileSize,
        y: dustLine * viewParams.sourceTileSize
    };
}