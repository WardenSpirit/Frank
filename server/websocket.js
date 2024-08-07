const GameFactory = require('./gameFactory.js');

let gameFactory = new GameFactory();
let game = null;
let webSockets = [];
let moves = [];
let alreadySentMove = [];

/**
 * Sets up a web socket GameFactoryconnection. Starts listening to the events catched by each connected socket.
 */

function onConnect(webSocket) {
    console.log("+ connection");

    webSockets.push(webSocket);
    if (webSockets.length == 1) {
        startANewGame();
    } else {
        webSocket.send(JSON.stringify({type: "GAME", clearData: game}));
    }
    sendToAll("PLAYERS", webSockets.length);

    webSocket.addEventListener("message", ({ data }) => {
        if (isValidMove(webSocket, data)) {
            recordMove(webSocket, data);
            if (allMovesGathered()) {
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
        console.log("- connection");
        eliminateWebSocket(webSocket);

        function eliminateWebSocket(webSocket) {
            webSockets.splice(webSockets.indexOf(webSocket), 1);
            sendToAll("PLAYERS", webSockets.length);
            if (allMovesGathered()) {
                realizeTurn();
            }
        }
    });
};

function allMovesGathered() {
    return moves.length === webSockets.length;
}

/**
 * Realizes a turn with the moves that have come.
 */
function realizeTurn() {
    sendToAll("MOVES", moves);
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
    game = gameFactory.createGame();
    sendToAll("GAME", game);
}

/**
 * Sends JSON-stringified data to every connected web socket.
 * @param data 
 */
function sendToAll(type, data) {
    let text = JSON.stringify({type: type, clearData: data})
    for (let i = 0; i < webSockets.length; i++) {
        webSockets[i].send(text);
    }
}


module.exports = { onConnect };