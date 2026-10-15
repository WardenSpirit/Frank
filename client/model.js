import * as view from './view/view.js';
import protocol from '../shared/protocol.json' with { type: 'json' };
import * as controls from "./controls.js";

const { TERRAIN, DIRECTION } = protocol;

let connected;
let game;
let points = 0;
let players;

/**
 * Updates the game model based on the argument. Calls view to start displaying the new game state.
 * @param newGame The stringified game state to hold on the client side.
 */
export function updateGame(newGame) {
    newGame.points = points;
    game = newGame;
    view.renderGame(game);
    controls.allowTurn();
}

/**
 * Perform the moves in the argument with the hero on the local game instance. Calls view to display them.
 */
export function applyMoves(moves) {
    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];

        const oldHeroPosition = { x: game.heroPosition.x, y: game.heroPosition.y };
        moveHero(move);
        view.displayMove(oldHeroPosition, game.heroPosition, move);

        if (isTreasureReached()) {
            points++;
            view.displayFilter(true);
            view.displayPoints(points);
            break;
        }
        if (isHeroInHole()) {
            if (points > 0) { 
                points--;
             }
            view.displayFilter(false);
            view.displayPoints(points);
            break;
        }
    }
    controls.allowTurn();
    view.setInfoText("move on", 5000);

    function moveHero(direction) {
        let potentialNewHeroPosition;
        switch (direction) {
            case DIRECTION.UP:
                potentialNewHeroPosition = { x: game.heroPosition.x, y: (game.heroPosition.y - 1 + game.map[0].length) % game.map[0].length};
                break;
            case DIRECTION.RIGHT:
                potentialNewHeroPosition = { x: (game.heroPosition.x + 1) % game.map.length, y: game.heroPosition.y };
                break;
            case DIRECTION.DOWN:
                potentialNewHeroPosition = { x: game.heroPosition.x, y: (game.heroPosition.y + 1) % game.map[0].length };
                break;
            case DIRECTION.LEFT:
                potentialNewHeroPosition = { x: (game.heroPosition.x - 1 + game.map.length) % game.map.length, y: game.heroPosition.y };
                break;
        }
        game.heroPosition = potentialNewHeroPosition;
    }
}

function isTreasureReached() {
    return game.heroPosition.x === game.treasurePosition.x && game.heroPosition.y === game.treasurePosition.y;
}

function isHeroInHole() {
    return game.map[game.heroPosition.x][game.heroPosition.y] === TERRAIN.HOLE
}

export function setPlayers(number) {
    players = number;
    view.displayPlayers(number);
}

export function openConnection() {
    connected = true;
    view.setInfoText("wait for game", 500);
}

export function closeConnection() {
    connected = false;
    view.setInfoText("maybe refresh", 0);
}

export function isConnected() {
    return connected;
}