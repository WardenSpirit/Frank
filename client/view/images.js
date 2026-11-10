import settingsSchema from "../../shared/settings.json" with { type: "json" };

const ASSETS_PATH = "../view/assets/";
const SETTINGS_ASSETS_PATH = ASSETS_PATH + "settings/png/";
const TEXTURES_PATH = ASSETS_PATH + "textures/";

// The only registry of the titles: a title maps to the path of its image, or, for an image which depends on a texture
// set, to a function which returns the path for the textures.
const IMAGE_PATHS = new Map();
const IMAGES = new Map();

// The images which depend on a texture set: the `file` in the directory of the set which the settings pick for `kind`.
const TEXTURE_IMAGES = new Map([
    ["HERO", { kind: "actors", file: "Hero.png" }],
    ["TREASURE", { kind: "actors", file: "Treasure.png" }],
    ["PATH", { kind: "tiles", file: "Path.png" }],
    ["HOLE", { kind: "tiles", file: "Hole.png" }],
]);

function textureImagePath({ kind, file }, texture) {
    if (!settingsSchema[kind].values.includes(texture)) {
        throw new Error(`Unknown ${kind} texture: ${texture}`);
    }
    return `${TEXTURES_PATH}${kind}/${texture}/${file}`;
}

for (const [title, textureImage] of TEXTURE_IMAGES) {
    IMAGE_PATHS.set(title, textures => textureImagePath(textureImage, textures[textureImage.kind]));
}

export const charsToWidths = new Map();

IMAGE_PATHS.set("DUST", ASSETS_PATH + "Dust.png");
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

// Returns the path of the image of the title. Throws for an unknown title, for a title which depends on a texture
// when the textures are missing, and for a texture which isn't in the settings.
function getImagePath(title, textures) {
    const path = IMAGE_PATHS.get(title);
    if (path === undefined) {
        throw new Error(`Unknown image: ${title}`);
    }
    if (typeof path === "string") {
        return path;
    }
    if (!textures) {
        throw new Error(`The image ${title} depends on a texture, so it needs the textures argument`);
    }
    return path(textures);
}

// Caches the promise of the image. A failed image leaves the cache, so the next call loads it again.
function loadImage(path) {
    if (!IMAGES.has(path)) {
        IMAGES.set(
            path,
            (async () => {
                try {
                    const image = new Image();
                    image.src = path;
                    await image.decode();
                    return image;
                } catch (error) {
                    IMAGES.delete(path);
                    throw error;
                }
            })(),
        );
    }
    return IMAGES.get(path);
}

/**
 * Returns the image of the title.
 *
 * @param {string} title
 * @param {{actors: string, tiles: string}} [textures] The applied settings, or any object with these two fields.
 *     Required for the images which depend on a texture (HERO, TREASURE, PATH, HOLE).
 * @returns {Promise<HTMLImageElement>}
 */
export function getImage(title, textures) {
    return loadImage(getImagePath(title, textures));
}

/**
 * Returns the images which depend on the textures (HERO, TREASURE, PATH, HOLE). Rejects when any of them fails, so a
 * caller can draw all of them or none.
 *
 * @param {{actors: string, tiles: string}} textures
 * @returns {Promise<HTMLImageElement[]>}
 */
export function getTextureImages(textures) {
    return Promise.all([...TEXTURE_IMAGES.keys()].map(title => getImage(title, textures)));
}

// Loads the images of all texture sets of the settings (2 actors x 2 images + 2 tiles x 2 images) when the module is
// loaded. A game then never waits for an image, so the rendering of a game finishes before a message of the next game
// is handled and the games can't overwrite each other. A failed image is ignored here.
await Promise.allSettled(
    [...TEXTURE_IMAGES.values()].flatMap(textureImage =>
        settingsSchema[textureImage.kind].values.map(texture => loadImage(textureImagePath(textureImage, texture))),
    ),
);

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
