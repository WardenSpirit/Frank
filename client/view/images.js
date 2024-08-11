const ASSETS_PATH = "../view/assets/";

const IMAGE_PATHS = new Map();
IMAGE_PATHS.set("PATH", ASSETS_PATH + "Path.png");
IMAGE_PATHS.set("HOLE", ASSETS_PATH + "Hole.png");
IMAGE_PATHS.set("HERO", ASSETS_PATH + "Hero.png");
IMAGE_PATHS.set("DUST", ASSETS_PATH + "Dust.png");
IMAGE_PATHS.set("TREASURE", ASSETS_PATH + "Treasure.png");
IMAGE_PATHS.set("TABLE", ASSETS_PATH + "Table.png");
IMAGE_PATHS.set("DIGITS", ASSETS_PATH + "Digits.png");


const IMAGES = new Map();
let imagesReady = false;

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