const GameState = require("./gameState.js");

console.log("websockets call");

let game = null;
let webSockets = [];
let moves = [];
let alreadySentMove = [];

/**
 * Sets up a web socket connection. Starts listening to the events catched by each connected socket.
 */

function onConnect(webSocket) {
    console.log("new connection");

    webSockets.push(webSocket);
    if (webSockets.length == 1) {
        startANewGame();
    } else {
        webSocket.send(JSON.stringify(game));
    }

    webSocket.addEventListener("message", ({ data }) => {
        if (isValidMove(webSocket, data)) {
            recordMove(webSocket, data);
            if (allMovesSent()) {
                realizeTurn();
            }
        }

        function recordMove(webSocket, direction) {
            moves.push(direction);
            alreadySentMove.push(webSocket);
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
};

function allMovesSent() {
    return moves.length === webSockets.length;
}

/**
 * Realizes a turn with the moves that have come.
 */
function realizeTurn() {
    sendToAll(moves);
    game.makeMoves(moves);

    moves = [];
    alreadySentMove = [];

    if (game.isGameBeingFinished()) {
        startANewGame();
    }
}

/**
 * Sets up a new game and informs the clients by sending them the information about it's state.
 */
function startANewGame() {
    game = new GameState();
    sendToAll(game);
}

/**
 * Sends JSON-stringified data to every connected web socket.
 * @param data 
 */
function sendToAll(data) {
    for (let i = 0; i < webSockets.length; i++) {
        webSockets[i].send(JSON.stringify(data));
    }
}


module.exports = { onConnect };