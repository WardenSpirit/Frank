const ASSETS_PATH = "../assets/";

const TERRAIN_IMAGE_PATH = ASSETS_PATH + "Terrain.png";
const HERO_IMAGE_PATH = ASSETS_PATH + "Hero2.png";
const DUST_IMAGE_PATH = ASSETS_PATH + "Dust.png";
const TREASURE_IMAGE_PATH = ASSETS_PATH + "Treasure.png";

/**
 * Array that holds all the images returned by the promises.
 */
let images = [];

let imagePromises = [makeImagePromise(TERRAIN_IMAGE_PATH), makeImagePromise(HERO_IMAGE_PATH), makeImagePromise(DUST_IMAGE_PATH), makeImagePromise(TREASURE_IMAGE_PATH)];

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

export let terrainImage = images[0];
export let heroImage = images[1];
export let dustImage = images[2];
export let treasureImage = images[3];

export function isReady() {return Promise.allSettled(imagePromises);}