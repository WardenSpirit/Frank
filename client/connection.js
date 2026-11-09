import protocol from "../shared/protocol.json" with { type: "json" };

const { MESSAGE_TYPE } = protocol;

let gameWebSocket;

/**
 * Connects to the server that served this page and passes the connection events and the server messages to the
 * handlers. Call it once: another call would open a second connection and the handlers would get each message twice.
 * @param handlers Object with the functions onOpen(), onClose(), onGame(game), onMoves(moves) and onPlayers(number).
 */
export function connect({ onOpen, onClose, onGame, onMoves, onPlayers }) {
    // The browser resolves '/' against the page origin (http → ws, https → wss).
    gameWebSocket = new WebSocket("/");

    gameWebSocket.addEventListener("open", () => {
        onOpen();
    });

    gameWebSocket.addEventListener("close", () => {
        onClose();
    });

    gameWebSocket.addEventListener("error", e => {
        console.error(
            `Sorry, but an error occured while I was trying to connect you to the game server: ${JSON.stringify(e)}`,
        );
    });

    gameWebSocket.addEventListener("message", message => {
        let messageType = JSON.parse(message.data).type;
        let clearData = JSON.parse(message.data).clearData;
        if (messageType === MESSAGE_TYPE.GAME) {
            onGame(clearData);
        } else if (messageType === MESSAGE_TYPE.MOVES) {
            onMoves(clearData);
        } else if (messageType === MESSAGE_TYPE.PLAYERS) {
            onPlayers(clearData);
        }
    });
}

/**
 * Whether the connection to the server is open, so messages can be sent.
 */
export function isConnected() {
    return gameWebSocket?.readyState === WebSocket.OPEN;
}

/**
 * Sends the user's decision to the server via the web socket as a MOVE message. The connection must have opened:
 * before connect() and while connecting it throws, once closed it drops the message.
 * @param direction A string saying which direction the user chose to move.
 * @param gameId The id of the game the move is for.
 */
export function sendMove(direction, gameId) {
    gameWebSocket.send(
        JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: { direction: direction, gameId: gameId } }),
    );
}

/**
 * Sends the settings the user applied to the server as a SETTINGS message. The connection must have opened, the same
 * as for sendMove().
 * @param settings Object containing all setting fields.
 */
export function sendSettings(settings) {
    gameWebSocket.send(JSON.stringify({ type: MESSAGE_TYPE.SETTINGS, clearData: settings }));
}
