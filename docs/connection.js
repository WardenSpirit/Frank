import * as model from './model.js';

let expectedMessageType;

const gameWebSocket = new WebSocket("ws://localhost:8186");

function sendMove(direction) {
    gameWebSocket.send(direction);
    expectedMessageType = "MOVES";
}

const gameSpace = document.querySelector("gameSpace");

gameWebSocket.addEventListener("open", e => {
    expectedMessageType = "GAME";
});

gameWebSocket.addEventListener("error", e => {
    console.log("Sorry, but an error occured while I was trying to connect you to the game server.");
});

gameWebSocket.addEventListener("message", message => {
    let data = JSON.parse(message.data);
    if (expectedMessageType === "GAME") {
        console.log("expected GAME, got the following: " + message.data)
        model.updateGame(data);

    } else {        //expectedMessageType === "MOVES"
        console.log("expected MOVES, got the following: " + message.data)
        model.applyMoves(data);
        if (model.isGameFinished()) {
            expectedMessageType = "GAME";
        }
    }
});

export { sendMove };