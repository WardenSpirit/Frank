const GameFactory = require("./gameFactory.js");
const Countdown = require("./countdown.js");
const { parseClientMessage } = require("./clientMessage.js");
const { getDefaultSettings } = require("../shared/settings.js");
const { CLOSE, MESSAGE_TYPE } = require("../shared/protocol.json");

let gameFactory = new GameFactory();
let game = null;
let settings = getDefaultSettings();
let webSockets = [];
let moves = [];
let alreadySentMove = [];
let countdown = new Countdown(onTimeLimit);

/**
 * The time limit of the game ran out. A move for the old game that is still on the way is ignored by its gameId.
 */
function onTimeLimit() {
    startANewGame({ timeout: true });
}

/**
 * Sets up a web socket connection. Starts listening to the events caught by each connected socket.
 * @param webSocket The socket of the player who has just connected.
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
        webSocket.send(
            JSON.stringify({ type: MESSAGE_TYPE.GAME, clearData: { ...game, remainingMs: countdown.remainingMs() } }),
        );
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
 * Valid settings always start a new game, even when they equal the current ones.
 */
function handleSettings(appliedSettings) {
    settings = appliedSettings;
    startANewGame();
}

function recordMove(webSocket, direction) {
    moves.push(direction);
    alreadySentMove.push(webSocket);
}

function hasAlreadySentMove(webSocket) {
    return alreadySentMove.includes(webSocket);
}

function allMovesGathered() {
    return moves.length === webSockets.length;
}

/**
 * Discards the moves of the current turn, so every player can move again.
 */
function discardMoves() {
    moves = [];
    alreadySentMove = [];
}

/**
 * Removes the web socket from the game. A leaving player is removed when the connection starts closing and again when
 * it has closed; the second call does nothing, but it is the only one for a connection that drops without a close
 * frame. A client rejected over the player limit is never added, so calls for it do nothing either. When the last
 * player is gone, the countdown stops, so the server doesn't start new games for nobody; the next player to connect
 * starts a game and its countdown. Otherwise the departure can complete the turn of the remaining players, which is
 * then realized.
 */
function eliminateWebSocket(webSocket) {
    const index = webSockets.indexOf(webSocket);
    if (index === -1) {
        return;
    }
    webSockets.splice(index, 1);
    sendToAll(MESSAGE_TYPE.PLAYERS, webSockets.length);
    if (webSockets.length === 0) {
        countdown.stop();
    } else if (allMovesGathered()) {
        realizeTurn();
    }
}

/**
 * Realizes a turn with the moves that have come.
 */
function realizeTurn() {
    sendToAll(MESSAGE_TYPE.MOVES, moves);
    game.makeMoves(moves);

    if (game.isGameBeingFinished()) {
        startANewGame();
    } else {
        discardMoves();
    }
}

/**
 * Discards the moves of the previous game, sets up a new game and sends it to all players. The countdown is per game,
 * so every new game restarts it with the time limit of the game's settings, while a turn that doesn't finish the game
 * doesn't.
 * @param broadcastFields Fields added only to this broadcast, such as timeout. A player connecting later doesn't get
 *     them, because onConnect sends the game itself.
 */
function startANewGame(broadcastFields = {}) {
    discardMoves();
    game = gameFactory.createGame(settings);
    countdown.start(game.settings.timeLimit * 1000);
    sendToAll(MESSAGE_TYPE.GAME, { ...game, remainingMs: countdown.remainingMs(), ...broadcastFields });
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
