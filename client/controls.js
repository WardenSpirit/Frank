import * as connection from './connection.js';

let notTurnedYet = true;

document.body.addEventListener("touchstart", e => handleTouchStart(e));
document.body.addEventListener("touchstart", e => handleTouchEnd(e));
document.body.addEventListener("keydown", e => handleKeyDown(e));

let touchStartX, touchStartY;

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

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            tryMove('RIGHT');
        } else {
            tryMove('LEFT');
        }
    } else {
        if (deltaY > 0) {
            tryMove('DOWN');
        } else {
            tryMove('UP');
        }
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
    }
}

/**
 * Checks that the user hasn't moved this turn yet and sends the move to the server if not.
 * @param direction String with the intended direction of movement.
 */
function tryMove(direction) {
    if (notTurnedYet) {
        connection.sendMove(direction);
        notTurnedYet = true;
    }
}