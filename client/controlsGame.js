import * as connection from "./connection.js";
import * as view from "./view/view.js";
import * as model from "./model.js";
import protocol from "../shared/protocol.json" with { type: "json" };

const { DIRECTION } = protocol;

let turnAllowed = false;

const directions = {
    up: DIRECTION.UP,
    down: DIRECTION.DOWN,
    left: DIRECTION.LEFT,
    right: DIRECTION.RIGHT
};

const AUDIO_ELEMENT = document.getElementById("background-audio");

/**
 * Handles directional input (a swipe or an arrow key) in the game.
 *
 * @param direction String with the intended direction of movement.
 */
export function handleDirection(direction) {
    const move = directions[direction];

    if (move === undefined || !turnAllowed || !connection.isConnected()) {
        return;
    }

    connection.sendMove(move, model.getGameId());
    turnAllowed = false;
    view.setInfoText("wait for the others", 500);
}

/**
 * Toggles background music.
 */
export function handleTap() {
    if (!AUDIO_ELEMENT) {
        return;
    }

    if (AUDIO_ELEMENT.paused) {
        AUDIO_ELEMENT.play().catch(error => {
            console.warn("Unable to play background music:", error);
        });
    } else {
        AUDIO_ELEMENT.pause();
    }
}

/**
 * Allows the next game turn.
 */
export function allowTurn() {
    turnAllowed = true;
}