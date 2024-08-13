const ASSETS_PATH = "../view/assets/";

const IMAGE_PATHS = new Map();
const IMAGES = new Map();
let imagesReady = false;

export const charsToWidths = new Map();

IMAGE_PATHS.set("PATH", ASSETS_PATH + "Path.png");
IMAGE_PATHS.set("HOLE", ASSETS_PATH + "Hole.png");
IMAGE_PATHS.set("HERO", ASSETS_PATH + "Hero.png");
IMAGE_PATHS.set("DUST", ASSETS_PATH + "Dust.png");
IMAGE_PATHS.set("TREASURE", ASSETS_PATH + "Treasure.png");
IMAGE_PATHS.set("TABLE", ASSETS_PATH + "Table.png");
IMAGE_PATHS.set("DIGITS", ASSETS_PATH + "Digits.png");
IMAGE_PATHS.set("CHARACTERS", ASSETS_PATH + "Characters.png");

async function loadImages() {
    for (const KEY of IMAGE_PATHS.keys()) {
        const PATH = IMAGE_PATHS.get(KEY);
        const IMAGE = new Image();
        IMAGE.src = PATH;
        await IMAGE.decode();
        IMAGES.set(KEY, IMAGE)
    }
    imagesReady = true;
}

export async function getImage(title) {
    if (!imagesReady) {
        console.log("images loading");
        await (loadImages());
    }
    return IMAGES.get(title);
}

charsToWidths.set('a', 6);
charsToWidths.set('b', 5);
charsToWidths.set('c', 5);
charsToWidths.set('d', 6);
charsToWidths.set('e', 6);
charsToWidths.set('f', 4);
charsToWidths.set('g', 6);
charsToWidths.set('h', 6);
charsToWidths.set('i', 5);
charsToWidths.set('j', 3);
charsToWidths.set('k', 7);
charsToWidths.set('l', 5);
charsToWidths.set('m', 10);
charsToWidths.set('n', 7);
charsToWidths.set('o', 5);
charsToWidths.set('p', 5);
charsToWidths.set('q', 6);
charsToWidths.set('r', 4);
charsToWidths.set('s', 5);
charsToWidths.set('t', 5);
charsToWidths.set('u', 6);
charsToWidths.set('v', 6);
charsToWidths.set('w', 10);
charsToWidths.set('x', 7);
charsToWidths.set('y', 6);
charsToWidths.set('z', 5);
charsToWidths.set(' ', 4);
const CHAR_ORDER = "abcdefghijklmnopqrstuvwxyz ";

export function getCharOrigin(char) {
    let distance = 0;
    if (CHAR_ORDER.indexOf(char) == -1) {
        return { x: 0, y: 0 };
    }
    for (let i = 0; CHAR_ORDER[i] != char; i++) {
        distance += charsToWidths.get(CHAR_ORDER[i]);
    }
    return { x: distance, y: 0 };
}