const GameFactory = require('./gameFactory.js');
const { parseClientMessage } = require('./clientMessage.js');
const { MESSAGE_TYPE } = require('../shared/protocol.json');

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
        webSocket.send(JSON.stringify({type: MESSAGE_TYPE.GAME, clearData: game}));
    }
    sendToAll(MESSAGE_TYPE.PLAYERS, webSockets.length);

    webSocket.addEventListener("message", ({ data }) => {
        const message = parseClientMessage(data);
        if (message === null) {
            return;
        }

        switch (message.type) {
            case MESSAGE_TYPE.MOVE:
                handleMove(webSocket, message.clearData.direction);
                break;
        }

        function handleMove(webSocket, direction) {
            if (!hasAlreadySentMove(webSocket)) {
                recordMove(webSocket, direction);
                if (allMovesGathered()) {
                    realizeTurn();
                }
            }
        }

        function recordMove(webSocket, direction) {
            moves.push(direction);
            alreadySentMove.push(webSocket);
        }

        function hasAlreadySentMove(webSocket) {
            return alreadySentMove.includes(webSocket);
        }
    });

    webSocket.addEventListener("close", () => {
        console.log("- connection");
        eliminateWebSocket(webSocket);

        function eliminateWebSocket(webSocket) {
            webSockets.splice(webSockets.indexOf(webSocket), 1);
            sendToAll(MESSAGE_TYPE.PLAYERS, webSockets.length);
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
    sendToAll(MESSAGE_TYPE.MOVES, moves);
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
    sendToAll(MESSAGE_TYPE.GAME, game);
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