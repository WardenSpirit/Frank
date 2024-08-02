import viewParams from '../viewParams.json' with { type: 'json' };
import * as images from '../images.js';

const dustCount = images.dustImage.width / viewParams.sourceTileSize;
const Y = 0;


export function calculateDustSourceOrigin(dust) {
    return dust.phase >= dustCount ?
        null : {
            x: dust.phase * viewParams.sourceTileSize,
            y: Y
        };
}