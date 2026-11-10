import { test, expect, beforeEach, afterEach, vi } from "vitest";
import settings from "../shared/settings.json" with { type: "json" };
import { createFakeImage } from "./support/fakeImage.js";

const TEXTURES = "../view/assets/textures/";
// The actors and the tiles are different sets, so a swapped kind in a path is noticed.
const SNAKE_VOLCANO = { actors: "snake", tiles: "volcano" };
const CAT_GARDEN = { actors: "cat", tiles: "garden" };

let requested;
let failing;
let images;

// The module loads the images of all texture sets when it is imported, so the failing paths are set before. The fake
// Image needs no browser: it records the requested paths and fails to decode those in `failing`.
async function importImages(failingPaths = []) {
    vi.resetModules();
    requested = [];
    failing = new Set(failingPaths);
    vi.stubGlobal("Image", createFakeImage({ requested, fails: path => failing.has(path) }));
    images = await import("../client/view/images.js");
}

beforeEach(async () => {
    await importImages();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

test.each([
    { title: "HERO", textures: SNAKE_VOLCANO, expected: `${TEXTURES}actors/snake/Hero.png` },
    { title: "HERO", textures: CAT_GARDEN, expected: `${TEXTURES}actors/cat/Hero.png` },
    { title: "TREASURE", textures: SNAKE_VOLCANO, expected: `${TEXTURES}actors/snake/Treasure.png` },
    { title: "TREASURE", textures: CAT_GARDEN, expected: `${TEXTURES}actors/cat/Treasure.png` },
    { title: "PATH", textures: SNAKE_VOLCANO, expected: `${TEXTURES}tiles/volcano/Path.png` },
    { title: "PATH", textures: CAT_GARDEN, expected: `${TEXTURES}tiles/garden/Path.png` },
    { title: "HOLE", textures: SNAKE_VOLCANO, expected: `${TEXTURES}tiles/volcano/Hole.png` },
    { title: "HOLE", textures: CAT_GARDEN, expected: `${TEXTURES}tiles/garden/Hole.png` },
])("getImage($title) picks $expected for the textures $textures", async ({ title, textures, expected }) => {
    const image = await images.getImage(title, textures);

    expect(image.path).toBe(expected);
});

test("getImage ignores the textures for an image which does not depend on them", async () => {
    const withSnake = await images.getImage("DUST", SNAKE_VOLCANO);
    const withCat = await images.getImage("DUST", CAT_GARDEN);
    const without = await images.getImage("DUST");

    expect(withCat).toBe(withSnake);
    expect(without).toBe(withSnake);
});

test("getImage names the missing textures argument for an image which depends on a texture", () => {
    expect(() => images.getImage("HERO")).toThrow(/HERO.*textures/);
});

test("getImage names the unknown title", () => {
    expect(() => images.getImage("MISSING", CAT_GARDEN)).toThrow("Unknown image: MISSING");
});

test.each([
    { title: "HERO", textures: { actors: "dog", tiles: "garden" }, message: "Unknown actors texture: dog" },
    { title: "PATH", textures: { actors: "cat", tiles: "desert" }, message: "Unknown tiles texture: desert" },
    { title: "HERO", textures: { tiles: "garden" }, message: "Unknown actors texture: undefined" },
])("getImage($title) rejects the textures $textures", ({ title, textures, message }) => {
    expect(() => images.getImage(title, textures)).toThrow(message);
});

test("the images of all texture sets of the settings are loaded when the module is imported", async () => {
    // Arrange
    const expected = [
        ...settings.actors.values.flatMap(actors =>
            ["Hero.png", "Treasure.png"].map(file => `${TEXTURES}actors/${actors}/${file}`),
        ),
        ...settings.tiles.values.flatMap(tiles =>
            ["Path.png", "Hole.png"].map(file => `${TEXTURES}tiles/${tiles}/${file}`),
        ),
    ].sort();

    // Act
    await importImages();
    const actual = requested.filter(path => path.startsWith(TEXTURES)).sort();

    // Assert
    expect(actual).toEqual(expected);
});

test("getImage loads an image only once", async () => {
    const first = images.getImage("HERO", CAT_GARDEN);
    const second = images.getImage("HERO", CAT_GARDEN);

    expect(await second).toBe(await first);
    expect(requested.filter(path => path === `${TEXTURES}actors/cat/Hero.png`)).toHaveLength(1);
});

test("a failed image rejects and is loaded again by the next call", async () => {
    // Arrange
    const path = `${TEXTURES}actors/snake/Hero.png`;
    await importImages([path]);

    // Act
    await expect(images.getImage("HERO", SNAKE_VOLCANO)).rejects.toThrow(`cannot decode ${path}`);
    failing.delete(path);
    const image = await images.getImage("HERO", SNAKE_VOLCANO);

    // Assert
    expect(image.path).toBe(path);
    // The preload at the import, the first call and the call after the file works again.
    expect(requested.filter(requestedPath => requestedPath === path)).toHaveLength(3);
});

test("getTextureImages resolves with the four images of the textures", async () => {
    const actual = (await images.getTextureImages(SNAKE_VOLCANO)).map(image => image.path);

    expect(actual).toEqual([
        `${TEXTURES}actors/snake/Hero.png`,
        `${TEXTURES}actors/snake/Treasure.png`,
        `${TEXTURES}tiles/volcano/Path.png`,
        `${TEXTURES}tiles/volcano/Hole.png`,
    ]);
});

test("getTextureImages rejects when one image fails, so a game is drawn with all images or none", async () => {
    await importImages([`${TEXTURES}tiles/volcano/Hole.png`]);

    await expect(images.getTextureImages(SNAKE_VOLCANO)).rejects.toThrow("Hole.png");
});
