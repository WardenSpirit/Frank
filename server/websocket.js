const GameFactory = require('./gameFactory.js');
const { parseClientMessage } = require('./clientMessage.js');
const { CLOSE, MESSAGE_TYPE } = require('../shared/protocol.json');

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

    webSocket.on("message", (data, isBinary) => {
        // Messages that were already on the way when the server rejected the client don't count.
        if (webSocket.readyState !== webSocket.OPEN) {
            return;
        }

        // Every client message is JSON in a text frame, so a binary frame is invalid even if its bytes are a valid MOVE.
        const message = isBinary ? null : parseClientMessage(data.toString());
        if (message === null) {
            rejectClient(webSocket);
            return;
        }

        switch (message.type) {
            case MESSAGE_TYPE.MOVE:
                handleMove(webSocket, message.clearData);
                break;
        }

        function handleMove(webSocket, move) {
            if (move.gameId === game.gameId && !hasAlreadySentMove(webSocket)) {
                recordMove(webSocket, move.direction);
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

    webSocket.on("close", () => {
        console.log("- connection");
        eliminateWebSocket(webSocket);
    });

    // ws rejects an invalid frame itself, for example a text frame that isn't valid UTF-8, and starts closing the
    // connection with its own close code. An error without a listener would crash the server.
    webSocket.on("error", error => {
        console.log("- invalid frame: " + error.message);
        eliminateWebSocket(webSocket);
    });
};

/**
 * Closes the connection of a client that sent an invalid message, for example an outdated client. The client may
 * already consider its move sent, so the turn would otherwise wait for it forever. The client is removed from the turn
 * right away, because the connection closes only once the client answers the close frame.
 */
function rejectClient(webSocket) {
    eliminateWebSocket(webSocket);
    webSocket.close(CLOSE.INVALID_MESSAGE.CODE, CLOSE.INVALID_MESSAGE.REASON);
}

/**
 * Removes the web socket from the game. A rejected client is removed twice, on rejection or on an invalid frame and
 * then on close; the second call does nothing.
 */
function eliminateWebSocket(webSocket) {
    const index = webSockets.indexOf(webSocket);
    if (index === -1) {
        return;
    }
    webSockets.splice(index, 1);
    sendToAll(MESSAGE_TYPE.PLAYERS, webSockets.length);
    if (allMovesGathered()) {
        realizeTurn();
    }
}

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