import * as parserUtils from './parserUtils.js';

export function getDigitsOrigins(number) {
    let digits = Array.from(String(number), Number);
    let returnValues = digits.map(digit => parserUtils.getOriginInLine(0, digit));
    return returnValues;
}