import * as images from './images.js';
import * as terrainRenderer from './renderer/terrainRenderer.js';
import * as heroRenderer from './renderer/heroRenderer.js';
import * as dustRenderer from './renderer/dustRenderer.js';
import * as treasureRenderer from './renderer/treasureRenderer.js';
import * as tableRenderer from './renderer/tableRenderer.js';
import * as statsRenderer from './renderer/statsRenderer.js';
import * as drawingContext from './renderer/drawingContext.js'

/**
 * Displays the specified game on the screen.
 * @param renderedGame The game to be rendered.
 */
export function renderGame(renderedGame) {
    drawingContext.initSquareProportions(renderedGame.map.length, renderedGame.map[0].length);

    terrainRenderer.renderMap(renderedGame.map);
    heroRenderer.setNewPosition(renderedGame.heroPosition);
    heroRenderer.startRenderingHero();
    dustRenderer.startRenderingDust();
    treasureRenderer.renderTreasure(renderedGame.treasurePosition);
    tableRenderer.renderTable();
    statsRenderer.renderPoints(renderedGame.points);
}

/**
 * Displays the move specified by old and new coordinations pairs on the screen.
 * @param oldHeroPosition The position which the hero moves from.
 * @param newHeroPosition The position which the hero moves to.
 */
export function displayMove(oldHeroPosition, newHeroPosition) {
    dustRenderer.addDust(oldHeroPosition);
    dustRenderer.removeDust(newHeroPosition);
    heroRenderer.setNewPosition(newHeroPosition);
}

export function displayPoints(points) {
    statsRenderer.renderPoints(points);
}

export async function displayPlayers(players) {
    statsRenderer.renderPlayers(players);
}