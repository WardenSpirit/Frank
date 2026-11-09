import * as images from "../images.js";

/**
 * Returns the width of a bitmap-text string in source-image pixels.
 *
 * @param {string} text
 * @returns {number}
 */
export function measureBitmapText(text) {
    let width = 0;

    for (const character of text.toLowerCase()) {
        width += images.getCharWidth(character);
    }

    return width;
}

/**
 * Draws bitmap text from the shared character sprite sheet.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} charImg
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {number} scaleX
 * @param {number} scaleY
 * @returns {number} Rendered text width.
 */
export function drawBitmapText(ctx, charImg, text, x, y, scaleX = 1, scaleY = scaleX) {
    let currentX = x;

    for (const character of text.toLowerCase()) {
        const width = images.getCharWidth(character);

        if (!images.charsToWidths.has(character)) {
            currentX += width * scaleX;
            continue;
        }

        const origin = images.getCharOrigin(character);

        ctx.drawImage(
            charImg,
            origin.x,
            origin.y,
            width,
            charImg.height,
            currentX,
            y,
            width * scaleX,
            charImg.height * scaleY,
        );

        currentX += width * scaleX;
    }

    return currentX - x;
}
