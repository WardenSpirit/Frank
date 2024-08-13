import * as images from '../images.js';


function getCharsOrigins(text) {
    const CHARS_SOURCE_ORIGINS = [];

    for (const char of text) {
        CHARS_SOURCE_ORIGINS.push(images.getCharOrigin(char));
    }

    return CHARS_SOURCE_ORIGINS;
}


export { getCharsOrigins };