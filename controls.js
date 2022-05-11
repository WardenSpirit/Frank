import * as connection from 'connection.js';

let notTurnedYet = true;

const upperButton = document.querySelector("#upperButton");
const lefterButton = document.querySelector("#lefterButton");
const righterButton = document.querySelector("#righterButton");
const downerButton = document.querySelector("#downerButton");

upperButton.addEventListener("click", () => tryMove("UP"));
lefterButton.addEventListener("click", () => tryMove("LEFT"));
righterButton.addEventListener("click", () => tryMove("RIGHT"));
downerButton.addEventListener("click", () => tryMove("DOWN"));

document.body.addEventListener("keydown", e => handleKeyDown(e));

function handleKeyDown(e) {
    switch (e.code) {
        case "ArrowUp":
            tryMove('UP'); break;      //up
        case "ArrowLeft":
            tryMove('LEFT'); break;     //left
        case "ArrowRight":
            tryMove('RIGHT'); break;    //right
        case "ArrowDown":
            tryMove('DOWN'); break;     //down
    }
}

function tryMove(direction) {
    if (notTurnedYet) {
        connection.sendMove(direction);
        notTurnedYet = true;
    }
}