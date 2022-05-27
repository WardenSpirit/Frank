import * as model from './model.js';

/**
 * Type of message the client expects the server sends to him next. Can be either "GAME" or "MOVES".
 */
let expectedMessageType;

/**
 * WebSocket via which the client connects to the server.
 */
const gameWebSocket = new WebSocket("ws://localhost:8186");

/**
 * Sends the user's decision to the server via the web socket and sets the expectedMessageType to "MOVES".
 * @param direction A string saying which direction the user chose to move.
 */
function sendMove(direction) {
    gameWebSocket.send(direction);
    expectedMessageType = "MOVES";
}

gameWebSocket.addEventListener("open", () => {
    expectedMessageType = "GAME";
});

gameWebSocket.addEventListener("error", e => {
    console.error(`Sorry, but an error occured while I was trying to connect you to the game server: ${JSON.stringify(e)}`);
});

gameWebSocket.addEventListener("message", message => {
    let data = JSON.parse(message.data);
    if (expectedMessageType === "GAME") {
        model.updateGame(data);

    } else {        //expectedMessageType === "MOVES"
        model.applyMoves(data);
        if (model.isGameFinished()) {
            expectedMessageType = "GAME";
        }
    }
});

export { sendMove };