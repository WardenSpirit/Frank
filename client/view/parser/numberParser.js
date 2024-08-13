import * as generalTileParser from './generalTileParser.js';

export function getDigitsOrigins(number) {
    let digits = Array.from(String(number), Number);
    return digits.map(digit => generalTileParser.getTileSourceOrigin(0, digit));
}