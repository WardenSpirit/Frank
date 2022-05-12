import * as view from './view.js';

let expectedMessageType;

const gameWebSocket = new WebSocket("ws://localhost:8186");

function sendMove(direction) {
    gameWebSocket.send(direction);
    expectedMessageType = "MOVES";
}

const gameSpace = document.querySelector("gameSpace");

gameWebSocket.addEventListener("open", e => {
    console.log("open, client");
    expectedMessageType = "GAME";
});

gameWebSocket.addEventListener("error", e => {
    console.log("Sorry, but an error occured while I was trying to connect you to the game server.");
});

gameWebSocket.addEventListener("message", message => {
    let data = JSON.parse(message.data);
    if (expectedMessageType === "GAME") {       //kontroluj podle stavu hry, ne podle unefined
        console.log("map: " + JSON.parse(message.data).map);
        view.renderGame(JSON.parse(message.data));
    } else {        //expectedMessageType === "MOVES"
        console.log("moves: " + JSON.parse(message.data));
        view.animateMoves(JSON.parse(message.data));
    }

    //only info messages from the server should be accepted here
});

export { sendMove };