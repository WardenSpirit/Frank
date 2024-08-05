const ASSETS_PATH = "../view/assets/";

const PATH_IMAGE_PATH = ASSETS_PATH + "Path.png";
const HOLE_IMAGE_PATH = ASSETS_PATH + "Hole.png";
const HERO_IMAGE_PATH = ASSETS_PATH + "Hero_Snake.png";
const DUST_IMAGE_PATH = ASSETS_PATH + "Dust.png";
const TREASURE_IMAGE_PATH = ASSETS_PATH + "Treasure.png";
const TABLE_IMAGE_PATH = ASSETS_PATH + "Table.png";
const DIGITS_IMAGE_PATH = ASSETS_PATH + "Digits.png";

/**
 * Array that holds all the images returned by the promises.
 */
let images = [];

let imagePromises = [
    makeImagePromise(PATH_IMAGE_PATH),
    makeImagePromise(HOLE_IMAGE_PATH),
    makeImagePromise(HERO_IMAGE_PATH),
    makeImagePromise(DUST_IMAGE_PATH),
    makeImagePromise(TREASURE_IMAGE_PATH),
    makeImagePromise(TABLE_IMAGE_PATH),
    makeImagePromise(DIGITS_IMAGE_PATH)
];

/**
 * Makes and returns a promise for loading the picture with the specified path.
 * @param imageSource Path of the picture which should be loaded.
 * @returns Promise of the picture.
 */
function makeImagePromise(imageSource) {
    return new Promise(function (resolve, reject) {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageSource;
        images.push(image);
    });
}

export let pathImage = images[0];
export let holeImage = images[1];
export let heroImage = images[2];
export let dustImage = images[3];
export let treasureImage = images[4];
export let tableImage = images[5];
export let digitsImage = images[6];

export function isReady() { return Promise.allSettled(imagePromises); }