import * as view from './view/view.js';
import params from './params.json' with {type: 'json'};
import * as controls from "./controls.js";

let isConnected;
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
            view.displayPoints(points);
            break;
        }
        if (isHeroInHole()) {
            if (points > 0) { 
                points--;
             }
            view.displayPoints(points);
            break;
        }
    }
    controls.allowTurn();
    view.setInfoText("move on", 5000);

    function moveHero(direction) {
        let potentialNewHeroPosition;
        switch (direction) {
            case "UP":
                potentialNewHeroPosition = { x: game.heroPosition.x, y: (game.heroPosition.y - 1 + game.map[0].length) % game.map[0].length};
                break;
            case "RIGHT":
                potentialNewHeroPosition = { x: (game.heroPosition.x + 1) % game.map.length, y: game.heroPosition.y };
                break;
            case "DOWN":
                potentialNewHeroPosition = { x: game.heroPosition.x, y: (game.heroPosition.y + 1) % game.map[0].length };
                break;
            case "LEFT":
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
    return game.map[game.heroPosition.x][game.heroPosition.y] != params.PATH_CODE
}

export function setPlayers(number) {
    players = number;
    view.displayPlayers(number);
}

export function openConnection() {
    isConnected = true;
    view.setInfoText("wait for game", 500);
}

export function closeConnection() {
    isConnected = false;
    view.setInfoText("maybe refresh", 0);
}