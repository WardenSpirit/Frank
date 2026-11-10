import { test, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import settings from "../shared/settings.json" with { type: "json" };
import { createFakeImage } from "./support/fakeImage.js";

const VIEW_DIRECTORY = new URL("../client/view/", import.meta.url);
const ASSETS_DIRECTORY = new URL("assets/", VIEW_DIRECTORY);
// The server serves the client directory as `/`, so a browser resolves this prefix of the paths of images.js to
// client/view/assets/.
const ASSETS_PATH_PREFIX = "../view/assets/";

const TEXTURE_SETS = settings.actors.values.flatMap(actors => settings.tiles.values.map(tiles => ({ actors, tiles })));

// The titles which the code of the client asks for: getImage("TITLE") and the icon of a row of the settings form.
function titlesUsedByTheClient() {
    const titles = new Set();
    const files = readdirSync(VIEW_DIRECTORY, { recursive: true }).filter(file => file.endsWith(".js"));
    for (const file of files) {
        const source = readFileSync(new URL(file, VIEW_DIRECTORY), "utf8");
        for (const [, getImageTitle, iconTitle] of source.matchAll(
            /getImage\(\s*["']([A-Z_]+)["']|\bicon:\s*["']([A-Z_]+)["']/g,
        )) {
            titles.add(getImageTitle ?? iconTitle);
        }
    }
    return [...titles].sort();
}

function isExistingAsset(path) {
    return (
        path.startsWith(ASSETS_PATH_PREFIX) &&
        existsSync(new URL(path.slice(ASSETS_PATH_PREFIX.length), ASSETS_DIRECTORY))
    );
}

const TITLES = titlesUsedByTheClient();

let requested;
let images;

// A fake Image fails to decode a path without a file, like a browser, which also writes the failed request to the
// console of the user.
beforeEach(async () => {
    vi.resetModules();
    requested = [];
    vi.stubGlobal("Image", createFakeImage({ requested, fails: path => !isExistingAsset(path) }));
    images = await import("../client/view/images.js");
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// Without them the tests below would pass for any client code, if the pattern stopped matching.
test("the titles found in the code of the client include the known ones", () => {
    expect(TITLES).toEqual(
        expect.arrayContaining(["DUST", "HERO", "TREASURE", "PATH", "HOLE", "SETTINGS_BG", "SETTINGS_GOAL_ICON"]),
    );
});

test.each(TITLES)("the image %s of the client is known to images.js and has a file", async title => {
    const image = await images.getImage(title, { actors: settings.actors.default, tiles: settings.tiles.default });

    expect(isExistingAsset(image.path)).toBe(true);
});

// The import loads the images of all texture sets, whether the user picks them or not.
test("every image which the import loads has a file, so the startup logs no failed request", () => {
    const missing = requested.filter(path => !isExistingAsset(path));

    expect(missing).toEqual([]);
});

test.each(TEXTURE_SETS)("getTextureImages resolves for the textures $actors and $tiles", async textures => {
    await expect(images.getTextureImages(textures)).resolves.toHaveLength(4);
});
