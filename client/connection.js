import * as model from './model.js';

let expectedMessageType;

const gameWebSocket = new WebSocket("ws://localhost:8186");

function sendMove(direction) {
    gameWebSocket.send(direction);
    expectedMessageType = "MOVES";
}

const gameSpace = document.querySelector("gameSpace");

gameWebSocket.addEventListener("open", e => {
    console.log("Connected! =D");
    expectedMessageType = "GAME";
});

gameWebSocket.addEventListener("error", e => {
    console.log("Sorry, but an error occured while I was trying to connect you to the game server.");
});

gameWebSocket.addEventListener("message", message => {
    let data = JSON.parse(message.data);
    if (expectedMessageType === "GAME") {
        console.log("I got game: " + data);
        model.updateGame(data);

    } else {        //expectedMessageType === "MOVES"
        console.log("I got moves: " + data);
        model.applyMoves(data);
        if (model.isGameFinished()) {
            expectedMessageType = "GAME";
        }
    }
});

export { sendMove };