import { createRequire } from "node:module";
import gameAfterMove from "./gameAfterMove.js";

const require = createRequire(import.meta.url);
const { DIRECTION } = require("../../shared/protocol.json");

/**
 * Finds a shortest path from the hero to a hole or the treasure with breadth-first search.
 * Moves and the end of the game come from the server's Game, the code under test, because the test needs the server to end the game.
 * The path therefore doesn't check those rules; a bug in them moves the path along with the server.
 * @param game The game state as the server sends it in GAME.
 * @returns The directions of the path; only its last move ends the game.
 */
export default function pathToGameEnd(game) {
    const key = position => `${position.x},${position.y}`;
    const reachedBy = new Map([[key(game.heroPosition), null]]);
    const queue = [game.heroPosition];

    for (let i = 0; i < queue.length; i++) {
        const position = queue[i];
        for (const direction of Object.values(DIRECTION)) {
            const next = gameAfterMove(game, direction, position);
            if (reachedBy.has(key(next.heroPosition))) {
                continue;
            }
            reachedBy.set(key(next.heroPosition), { previous: position, direction: direction });
            if (next.isGameBeingFinished()) {
                return pathTo(next.heroPosition);
            }
            queue.push(next.heroPosition);
        }
    }
    throw new Error("The hero can reach neither a hole nor the treasure.");

    function pathTo(position) {
        const directions = [];
        for (let step = reachedBy.get(key(position)); step !== null; step = reachedBy.get(key(step.previous))) {
            directions.unshift(step.direction);
        }
        return directions;
    }
}
