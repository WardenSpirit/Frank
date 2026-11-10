import * as terrainRenderer from "./renderer/terrainRenderer.js";
import * as heroRenderer from "./renderer/heroRenderer.js";
import * as dustRenderer from "./renderer/dustRenderer.js";
import * as treasureRenderer from "./renderer/treasureRenderer.js";
import * as filterRenderer from "./renderer/filterRenderer.js";
import * as tableRenderer from "./renderer/tableRenderer.js";
import * as statsRenderer from "./renderer/statsRenderer.js";
import * as infoTextRenderer from "./renderer/infoTextRenderer.js";
import * as drawingContext from "./renderer/drawingContext.js";
import * as settingsRenderer from "./renderer/settingsRenderer.js";
import * as images from "./images.js";
import * as settings from "../settings.js";

let infoTextID;

/**
 * Displays the specified game on the screen with the textures of its settings. Rejects, before anything is drawn, when
 * an image of the textures fails to load, so the screen keeps the previous game.
 * @param renderedGame The game to be rendered.
 */
export async function renderGame(renderedGame) {
    const textures = renderedGame.settings;
    await images.getTextureImages(textures);
    drawingContext.initSquareProportions(renderedGame.map.length, renderedGame.map[0].length);
    // The canvas of the hero and the dust is cleared by now. Forget the hero and the dust of the previous game before the
    // first await below, so the animation can't draw them on the canvas of this game, at positions of the previous map.
    heroRenderer.reset();
    dustRenderer.reset();

    await heroRenderer.loadHeroImage(textures);
    await terrainRenderer.renderMap(renderedGame.map, textures);
    heroRenderer.setNewPosition(renderedGame.heroPosition);
    heroRenderer.startRenderingHero();
    dustRenderer.startRenderingDust();
    treasureRenderer.renderTreasure(renderedGame.treasurePosition, textures);
    tableRenderer.renderTable();
    statsRenderer.renderPoints(renderedGame.points);
    setInfoText("use arrows or drag", 5000);

    if (settings.isSettingsOpen()) {
        renderSettings();
    }
}

export function renderSettings() {
    settingsRenderer.renderSettingsForm(settings.getEditedSettings(), settings.getHighlightedIndex());
}

export function clearSettings() {
    settingsRenderer.clearSettingsForm();
}

/**
 * Displays the move specified by old and new coordinations pairs on the screen.
 * @param oldHeroPosition The position which the hero moves from.
 * @param newHeroPosition The position which the hero moves to.
 * @param direction The direction of the move, which the hero turns to.
 */
export function displayMove(oldHeroPosition, newHeroPosition, direction) {
    dustRenderer.addDust(oldHeroPosition);
    dustRenderer.removeDust(newHeroPosition);
    heroRenderer.setNewPosition(newHeroPosition, direction);
}

export function displayFilter(isGood) {
    filterRenderer.displayFilter(isGood);
}

export function displayPoints(points) {
    statsRenderer.renderPoints(points);
}

export async function displayPlayers(players) {
    statsRenderer.renderPlayers(players);
}

export function setInfoText(text, delay) {
    clearTimeout(infoTextID);
    infoTextRenderer.clearInfoText(text);
    if (delay == 0) {
        infoTextRenderer.renderInfoText(text);
    } else {
        infoTextID = setTimeout(() => {
            infoTextRenderer.renderInfoText(text);
        }, delay);
    }
}
