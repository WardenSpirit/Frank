const WebSocket = require("ws");
const GameState = require("./gameState.js");

const webSocketServer = new WebSocket.Server({ port: 8186 });

let game = null;

let webSockets = []
let moves = [];

webSocketServer.on("connection", webSocket => {

    webSockets[webSockets.length] = webSocket;

    if (webSockets.length == 1) {
        startANewGame();
    }

    webSocket.addEventListener("message", ({ data }) => {
        if (!hasAlreadySentMove(webSocket) &&
            data === "UP" || data === "RIGHT" || data === "DOWN" || data === "LEFT") {
            fillInMove(data);
        }
    });

    webSocket.addEventListener("close", () => {
        eliminateWebSocket(webSocket);
    });
});
//maybe the disconnection can be handled here as well, next to handling connection

function fillInMove(direction) {
    moves[moves.length] = direction;
    if (allMovesSent()) {
        realizeTurn();
    }
}

function eliminateWebSocket(webSocket) {
    webSockets.splice(webSockets.indexOf(webSocket), 1);
    if (allMovesSent) {
        realizeTurn();
    }
}

function allMovesSent() {
    return moves.length == webSockets.length;
}

function realizeTurn() {
    sendMovesToAll();
    game.performMoves();
    if (game.isGameBeingFinished()) {
        startANewGame();
    }
}

function startANewGame() {
    game = new GameState();
    sendToAll(game);
}

function sendToAll(message) {
    for (let i = 0; i < webSockets.length; i++) {
        webSockets[i].send(message);
    }
}