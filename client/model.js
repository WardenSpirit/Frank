import * as view from './view/view.js';

const HOLE = 1;

let game;

/**
 * Updates the game model based on the argument. Calls view to start displaying the new game state.
 * @param newGame The stringified game state to hold on the client side.
 */
export function updateGame(newGame) {
    console.log("updateGame(" + newGame + ") called");
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

        if (isGameFinished()) {
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

/**
 * Compares the coordinations of the hero, the treasure and the terrain on the map on the hero's coordinations
 * to tell whether the game is ended.
 * @returns True if the hero position means the end of the game, false otherwise.
 */
export function isGameFinished() {
    return game.map[game.heroPosition.x][game.heroPosition.y] === HOLE ||
        (game.heroPosition.x === game.treasurePosition.x &&
            game.heroPosition.y === game.treasurePosition.y);
}