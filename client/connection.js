import * as model from './model.js';
import params from './params.json' with { type: 'json' };

/**
 * WebSocket via which the client connects to the server.
 */
const serverAddress = params.websiteLocal; //params.websiteGlitch;
const gameWebSocket = new WebSocket(serverAddress);

/**
 * Sends the user's decision to the server via the web socket and sets the expectedMessageType to "MOVES".
 * @param direction A string saying which direction the user chose to move.
 */
function sendMove(direction) {
    gameWebSocket.send(direction);
}

gameWebSocket.addEventListener("open", () => {
    model.openConnection();
});

gameWebSocket.addEventListener("close", () => {
    model.closeConnection();
    gameWebSocket = new WebSocket(serverAddress);
});

gameWebSocket.addEventListener("error", e => {
    console.error(`Sorry, but an error occured while I was trying to connect you to the game server: ${JSON.stringify(e)}`);
});

gameWebSocket.addEventListener("message", message => {
    let messageType = JSON.parse(message.data).type;
    let clearData = JSON.parse(message.data).clearData;
    if (messageType === "GAME") {
        model.updateGame(clearData);
    } else if (messageType === "MOVES") {
        model.applyMoves(clearData);
    } else if (messageType === "PLAYERS") {
        model.setPlayers(clearData);
    }
});

export { sendMove };