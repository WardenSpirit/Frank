const GameFactory = require("./gameFactory.js");
const { parseClientMessage } = require("./clientMessage.js");
const { getDefaultSettings } = require("../shared/settings.js");
const { CLOSE, MESSAGE_TYPE } = require("../shared/protocol.json");

let gameFactory = new GameFactory();
let game = null;
let settings = getDefaultSettings();
let webSockets = [];
let moves = [];
let alreadySentMove = [];

/**
 * Sets up a web socket GameFactoryconnection. Starts listening to the events catched by each connected socket.
 */

function onConnect(webSocket) {
    console.log("+ connection");

    // A client rejected over the player limit gets these listeners too, because it can send an invalid frame before
    // its connection closes.
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

    if (webSockets.length >= settings.maxPlayers) {
        rejectOverLimit(webSocket);
        return;
    }

    webSockets.push(webSocket);
    eliminateWhenClosing(webSocket);
    if (webSockets.length == 1) {
        startANewGame();
    } else {
        webSocket.send(JSON.stringify({ type: MESSAGE_TYPE.GAME, clearData: game }));
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
            webSocket.close(CLOSE.INVALID_MESSAGE.CODE, CLOSE.INVALID_MESSAGE.REASON);
            return;
        }

        switch (message.type) {
            case MESSAGE_TYPE.MOVE:
                handleMove(webSocket, message.clearData);
                break;
            case MESSAGE_TYPE.SETTINGS:
                handleSettings(message.clearData);
                break;
        }
    });
}

/**
 * Rejects a client that connects while maxPlayers or more players are connected. The client never becomes a player: it
 * gets neither the game nor the number of players, and the server ignores its messages. The client hasn't broken any
 * rule, so its connection closes normally.
 */
function rejectOverLimit(webSocket) {
    console.log("x connection: " + webSockets.length + " players connected, maxPlayers " + settings.maxPlayers);
    webSocket.send(JSON.stringify({ type: MESSAGE_TYPE.REJECTED, clearData: null }));
    webSocket.close(CLOSE.REJECTED.CODE, CLOSE.REJECTED.REASON);
}

/**
 * Removes the player from the game as soon as the connection starts closing, not once it has closed. A player who has
 * sent the close frame has left, like one the server disconnects for an invalid message or frame, but the connection
 * closes only once the player's network answers, which takes up to 30 s if it stalls. The limit, PLAYERS and the turn
 * must not count the player in the meantime. ws has no event for the close frame, but it calls the close method of
 * the web socket itself on receiving the close frame or an invalid frame, so the method is wrapped.
 */
function eliminateWhenClosing(webSocket) {
    const close = webSocket.close;
    webSocket.close = function (...args) {
        eliminateWebSocket(webSocket);
        close.apply(webSocket, args);
    };
}

function handleMove(webSocket, move) {
    if (move.gameId === game.gameId && !hasAlreadySentMove(webSocket)) {
        recordMove(webSocket, move.direction);
        if (allMovesGathered()) {
            realizeTurn();
        }
    }
}

/**
 * Valid settings always start a new game, even when they equal the current ones. Moves of the current turn are
 * discarded, so every player can move in the new game.
 */
function handleSettings(appliedSettings) {
    settings = appliedSettings;
    discardMoves();
    startANewGame();
}

function recordMove(webSocket, direction) {
    moves.push(direction);
    alreadySentMove.push(webSocket);
}

function hasAlreadySentMove(webSocket) {
    return alreadySentMove.includes(webSocket);
}

/**
 * Removes the web socket from the game. A leaving player is removed when the connection starts closing and again when
 * it has closed; the second call does nothing, but it is the only one for a connection that drops without a close
 * frame. A client rejected over the player limit is never added, so calls for it do nothing either.
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

    discardMoves();

    if (game.isGameBeingFinished()) {
        startANewGame();
    }
}

/**
 * Discards the moves of the current turn, so every player can move again.
 */
function discardMoves() {
    moves = [];
    alreadySentMove = [];
}

/**
 * Sets up a new game and informs the clients by sending them the information about it's state.
 */
function startANewGame() {
    game = gameFactory.createGame(settings);
    sendToAll(MESSAGE_TYPE.GAME, game);
}

/**
 * Sends JSON-stringified data to every connected web socket.
 * @param data
 */
function sendToAll(type, data) {
    let text = JSON.stringify({ type: type, clearData: data });
    for (let i = 0; i < webSockets.length; i++) {
        webSockets[i].send(text);
    }
}

module.exports = { onConnect };
