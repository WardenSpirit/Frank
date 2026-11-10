import viewParams from "../viewParams.json" with { type: "json" };
import * as images from "../images.js";
import * as generalTileParser from "./generalTileParser.js";

const IMAGE = await images.getImage("DUST");
const DUST_COUNT = generalTileParser.getTileCountInLine(IMAGE);
const Y = 0;

export function calculateDustSourceOrigin(dust) {
    return dust.phase >= DUST_COUNT
        ? null
        : {
              x: dust.phase * viewParams.sourceTileSize,
              y: Y,
          };
}
