import * as view from './view.js';

const HOLE = 1;

let game;

export function updateGame(newGame) {
    game = newGame;
    view.renderGame(game);
}

export function applyMoves(moves) {
    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];

        const oldHeroPosition = { x: game.heroPosition.x, y: game.heroPosition.y };
        moveHero(move);
        view.animateMove(oldHeroPosition, game.heroPosition, move);

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

export function isGameFinished() {
    return game.map[game.heroPosition.x][game.heroPosition.y] === HOLE ||
        (game.heroPosition.x === game.treasurePosition.x &&
            game.heroPosition.y === game.treasurePosition.y);
}