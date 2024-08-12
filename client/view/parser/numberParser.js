import * as generalParser from './generalParser.js';

export function getDigitsOrigins(number) {
    let digits = Array.from(String(number), Number);
    return digits.map(digit => generalParser.getTileSourceOrigin(0, digit));
}