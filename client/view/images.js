const ASSETS_PATH = "../view/assets/";
const SETTINGS_ASSETS_PATH = ASSETS_PATH + "settings/png/";

const IMAGE_PATHS = new Map();
const IMAGES = new Map();

export const charsToWidths = new Map();

IMAGE_PATHS.set("PATH", ASSETS_PATH + "Path.png");
IMAGE_PATHS.set("HOLE", ASSETS_PATH + "Hole.png");
IMAGE_PATHS.set("HERO", ASSETS_PATH + "Hero.png");
IMAGE_PATHS.set("DUST", ASSETS_PATH + "Dust.png");
IMAGE_PATHS.set("TREASURE", ASSETS_PATH + "Treasure.png");
IMAGE_PATHS.set("GOOD_FILTER", ASSETS_PATH + "Good_filter.png");
IMAGE_PATHS.set("BAD_FILTER", ASSETS_PATH + "Bad_filter.png");
IMAGE_PATHS.set("TABLE", ASSETS_PATH + "Table.png");
IMAGE_PATHS.set("DIGITS", ASSETS_PATH + "Digits.png");
IMAGE_PATHS.set("CHARACTERS", ASSETS_PATH + "Characters.png");

IMAGE_PATHS.set("SETTINGS_BG", SETTINGS_ASSETS_PATH + "background_base.png");
IMAGE_PATHS.set("SETTINGS_GOAL_ICON", SETTINGS_ASSETS_PATH + "goal_icon.png");
IMAGE_PATHS.set("SETTINGS_MAP_ICON", SETTINGS_ASSETS_PATH + "map_icon.png");
IMAGE_PATHS.set("SETTINGS_SIZE_ICON", SETTINGS_ASSETS_PATH + "size.png");
IMAGE_PATHS.set("SETTINGS_PERCENTAGE_ICON", SETTINGS_ASSETS_PATH + "percentage.png");
IMAGE_PATHS.set("SETTINGS_PLAYER_ICON", SETTINGS_ASSETS_PATH + "player.png");
IMAGE_PATHS.set("SETTINGS_HOURGLASS_ICON", SETTINGS_ASSETS_PATH + "hourglass.png");
IMAGE_PATHS.set("SETTINGS_LEFT_ARR", SETTINGS_ASSETS_PATH + "left_arr.png");
IMAGE_PATHS.set("SETTINGS_RIGHT_ARR", SETTINGS_ASSETS_PATH + "right_arr.png");
IMAGE_PATHS.set("SETTINGS_TEXT_BTN", SETTINGS_ASSETS_PATH + "text_button.png");
IMAGE_PATHS.set("SETTINGS_TEXT_BTN_DIM", SETTINGS_ASSETS_PATH + "text_button_dim.png");
IMAGE_PATHS.set("SETTINGS_APPLY_DARK", SETTINGS_ASSETS_PATH + "apply_dark.png");
IMAGE_PATHS.set("SETTINGS_APPLY_DIM", SETTINGS_ASSETS_PATH + "apply_dim.png");
IMAGE_PATHS.set("SETTINGS_CLOSE_DARK", SETTINGS_ASSETS_PATH + "close_dark.png");
IMAGE_PATHS.set("SETTINGS_CLOSE_DIM", SETTINGS_ASSETS_PATH + "close_dim.png");

let imagesPromise;

async function loadImages() {
    for (const [key, path] of IMAGE_PATHS) {
        const image = new Image();
        image.src = path;
        await image.decode();
        IMAGES.set(key, image);
    }
}

export async function getImage(title) {
    if (!imagesPromise) {
        imagesPromise = loadImages();
    }

    await imagesPromise;

    const image = IMAGES.get(title);

    if (!image) {
        throw new Error(`Unknown image: ${title}`);
    }

    return image;
}

charsToWidths.set("a", 6);
charsToWidths.set("b", 5);
charsToWidths.set("c", 5);
charsToWidths.set("d", 6);
charsToWidths.set("e", 6);
charsToWidths.set("f", 4);
charsToWidths.set("g", 6);
charsToWidths.set("h", 6);
charsToWidths.set("i", 5);
charsToWidths.set("j", 3);
charsToWidths.set("k", 7);
charsToWidths.set("l", 5);
charsToWidths.set("m", 10);
charsToWidths.set("n", 7);
charsToWidths.set("o", 5);
charsToWidths.set("p", 5);
charsToWidths.set("q", 6);
charsToWidths.set("r", 4);
charsToWidths.set("s", 5);
charsToWidths.set("t", 5);
charsToWidths.set("u", 6);
charsToWidths.set("v", 6);
charsToWidths.set("w", 10);
charsToWidths.set("x", 7);
charsToWidths.set("y", 6);
charsToWidths.set("z", 5);
charsToWidths.set(" ", 4);

/**
 * Returns the width of a character in the character sprite sheet.
 * Unknown characters take the width of a space.
 *
 * @param {string} char
 * @returns {number}
 */
export function getCharWidth(char) {
    return charsToWidths.get(char) ?? charsToWidths.get(" ");
}

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
