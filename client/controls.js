import * as connection from './connection.js';
import * as view from './view/view.js';
import * as model from './model.js';

let hasTurned = false;

document.addEventListener("touchstart", e => handleTouchStart(e));
document.addEventListener("touchend", e => handleTouchEnd(e));
document.body.addEventListener("keydown", e => handleKeyDown(e));

let touchStartX, touchStartY;
const TOUCH_MOVE_THRESHHOLD = 5;

const AUDIO_ELEMENT = document.getElementById("background-audio");

/**
 * Initializes the coordinations of the touch start for later usage (when handling touch end event).
 * @param e A touch start event.
 */
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

/**
 * Compares the coordinations of the touch end event with the coordinations of the touch start event and decides which move the user wanted.
 * @param e A touch end event.
 */
function handleTouchEnd(e) {
    let deltaX = e.changedTouches[0].clientX - touchStartX;
    let deltaY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) + TOUCH_MOVE_THRESHHOLD) {
        if (deltaX > 0) {
            tryMove('RIGHT');
        } else {
            tryMove('LEFT');
        }
    } else if (Math.abs(deltaX) + TOUCH_MOVE_THRESHHOLD < Math.abs(deltaY)) {
        if (deltaY > 0) {
            tryMove('DOWN');
        } else {
            tryMove('UP');
        }
    } else {
        playMusic();
    }
}

/**
 * If the key of the event is an arrow key and the user hasn't played this turn yet, this function sends the corresponding turn to the server.
 * @param e A key down event.
 */
function handleKeyDown(e) {
    switch (e.code) {
        case "ArrowUp":
            e.preventDefault();
            tryMove('UP'); break;       //up
        case "ArrowLeft":
            e.preventDefault();
            tryMove('LEFT'); break;     //left
        case "ArrowRight":
            e.preventDefault();
            tryMove('RIGHT'); break;    //right
        case "ArrowDown":
            e.preventDefault();
            tryMove('DOWN'); break;     //down
        case "KeyM":
            playMusic();
    }
}

/**
 * Checks that the user hasn't moved this turn yet and sends the move to the server if not.
 * @param direction String with the intended direction of movement.
 */
function tryMove(direction) {
    if (!hasTurned && model.isConnected()) {
        connection.sendMove(direction);
        hasTurned = true;
        view.setInfoText("wait for the others", 500);
    }
}

function playMusic() {
    if (AUDIO_ELEMENT.paused) {
        AUDIO_ELEMENT.play();
    } else {
        AUDIO_ELEMENT.pause();
    }
}

export function allowTurn() {
    hasTurned = false;
}