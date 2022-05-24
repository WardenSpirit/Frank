import * as connection from './connection.js';

let notTurnedYet = true;

/*upperButton.addEventListener("click", () => tryMove("UP"));
lefterButton.addEventListener("click", () => tryMove("LEFT"));
righterButton.addEventListener("click", () => tryMove("RIGHT"));
downerButton.addEventListener("click", () => tryMove("DOWN"));*/

document.body.addEventListener("touchstart", e => handleTouchStart(e));
document.body.addEventListener("touchstart", e => handleTouchEnd(e));
document.body.addEventListener("keydown", e => handleKeyDown(e));

let touchStartX, touchStartY;
function handleTouchEnd(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}
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

function tryMove(direction) {

    if (notTurnedYet) {
        connection.sendMove(direction);
        notTurnedYet = true;
    }
}