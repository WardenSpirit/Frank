const WebSocket = require("ws");
const GameState = require("./gameState.js");

const webSocketServer = new WebSocket.Server({ port: 8186 });

let game = null;

let webSockets = [];
let moves = [];
let alreadySentMove = [];

webSocketServer.on("connection", webSocket => {

    webSockets[webSockets.length] = webSocket;

    if (webSockets.length == 1) {
        startANewGame();
    }

    webSocket.addEventListener("message", ({ data }) => {
        if (!hasAlreadySentMove(webSocket) &&
            data === "UP" || data === "RIGHT" || data === "DOWN" || data === "LEFT") {
            fillInMove(data);
            alreadySentMove[alreadySentMove.length] = webSocket;
        }

        function hasAlreadySentMove(webSocket) {
            return alreadySentMove.includes(webSocket);
        }
    });

    webSocket.addEventListener("close", () => {
        console.log("connection closed");
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
    game.performMoves(moves);
    if (game.isGameBeingFinished()) {
        startANewGame();
    }
}

function sendMovesToAll() {
    for (let i = 0; i < webSockets.length; i++) {
        console.log("sending moves");
        webSockets[i].send(JSON.stringify(moves));
    }
}

function startANewGame() {
    game = new GameState();
    sendGameToAll(game);
}

function sendGameToAll(game) {
    for (let i = 0; i < webSockets.length; i++) {
        console.log("sending a game via the webSocket " + i);
        webSockets[i].send(JSON.stringify(game));
    }
}