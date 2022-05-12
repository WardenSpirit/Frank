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
        if (isValidMove(webSocket, data)) {
            recordMove(webSocket, data);
            if (allMovesSent()) {
                realizeTurn();
            }
        }

        function recordMove(webSocket, direction) {
            moves[moves.length] = direction;
            alreadySentMove[alreadySentMove.length] = webSocket;
        }

        function isValidMove(webSocket, direction) {
            return !hasAlreadySentMove(webSocket) && isValidDirection(direction);
            function hasAlreadySentMove(webSocket) {
                return alreadySentMove.includes(webSocket);
            }
            function isValidDirection(direction) {
                return direction === "UP" ||
                    direction === "RIGHT" ||
                    direction === "DOWN" ||
                    direction === "LEFT";
            }
        }

    });

    webSocket.addEventListener("close", () => {
        console.log("connection closed");
        eliminateWebSocket(webSocket);

        function eliminateWebSocket(webSocket) {
            webSockets.splice(webSockets.indexOf(webSocket), 1);
            if (allMovesSent) {
                realizeTurn();
            }
        }
    });
});
//maybe the disconnection can be handled here as well, next to handling connection

function allMovesSent() {
    return moves.length === webSockets.length;
}

function realizeTurn() {
    sendToAll(moves);
    game.makeMoves(moves);

    moves = [];
    alreadySentMove = [];

    if (game.isGameBeingFinished()) {
        startANewGame();
    }
}

function startANewGame() {
    game = new GameState();
    sendToAll(game);
}

function sendToAll(data) {
    for (let i = 0; i < webSockets.length; i++) {
        webSockets[i].send(JSON.stringify(data));
    }
}