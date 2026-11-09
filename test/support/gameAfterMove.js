import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Game = require("../../server/game");

/**
 * Makes a move of the hero on a copy of the game. The rules of the move and of the end of the game come from the server's Game, the code under test.
 * The tests therefore don't check those rules here; a bug in them moves the result along with the server.
 * @param game The game state as the server sends it in GAME.
 * @param direction The direction of the move.
 * @param heroPosition The position the hero moves from; the position of the hero in the game by default.
 * @returns The server's Game after the move, so the caller can ask whether the move ended the game.
 */
export default function gameAfterMove(game, direction, heroPosition = game.heroPosition) {
    const afterMove = new Game(game.map, game.treasurePosition, { ...heroPosition }, game.gameId, game.settings);
    afterMove.makeMove(direction);
    return afterMove;
}
