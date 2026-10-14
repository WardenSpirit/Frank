import * as model from './model.js';

/**
 * WebSocket to the server that served this page; the browser resolves '/' against the page origin (http → ws, https → wss).
 */
let gameWebSocket = new WebSocket('/');

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