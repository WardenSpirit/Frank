import * as view from './view/view.js';
import params from './params.json' with {type: 'json'};

let game;
let points = 0;
let players = 0;

/**
 * Updates the game model based on the argument. Calls view to start displaying the new game state.
 * @param newGame The stringified game state to hold on the client side.
 */
export function updateGame(newGame) {
    newGame.points = points;
    game = newGame;
    view.renderGame(game);
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

    function moveHero(direction) {
        let potentialNewHeroPosition;
        switch (direction) {
            case "UP":
                potentialNewHeroPosition = { x: game.heroPosition.x, y: game.heroPosition.y - 1 };
                break;
            case "RIGHT":
                potentialNewHeroPosition = { x: game.heroPosition.x + 1, y: game.heroPosition.y };
                break;
            case "DOWN":
                potentialNewHeroPosition = { x: game.heroPosition.x, y: game.heroPosition.y + 1 };
                break;
            case "LEFT":
                potentialNewHeroPosition = { x: game.heroPosition.x - 1, y: game.heroPosition.y };
                break;
        }
        if (isPositionWithinMapBounds(potentialNewHeroPosition)) {
            game.heroPosition = potentialNewHeroPosition;
        }

        function isPositionWithinMapBounds(inspectedPosition) {
            return inspectedPosition.x >= 0 && inspectedPosition.x < game.map.length &&
                inspectedPosition.y >= 0 && inspectedPosition.y < game.map[0].length;
        }
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