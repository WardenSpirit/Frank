const { DIRECTION, MESSAGE_TYPE } = require('../shared/protocol.json');

/**
 * Parses and validates a message received from a client.
 * @param text The text of a text frame the client sent.
 * @returns The message with only the fields its type specifies, or null if the message isn't valid.
 */
function parseClientMessage(text) {
    let message;
    try {
        message = JSON.parse(text);
    } catch {
        return null;
    }
    if (!isObject(message)) {
        return null;
    }

    switch (message.type) {
        case MESSAGE_TYPE.MOVE:
            return parseMove(message.clearData);
        default:
            return null;
    }

    function parseMove(clearData) {
        if (!isObject(clearData) || !isValidDirection(clearData.direction) || !isValidGameId(clearData.gameId)) {
            return null;
        }
        return { type: MESSAGE_TYPE.MOVE, clearData: { direction: clearData.direction, gameId: clearData.gameId } };
    }

    function isValidDirection(direction) {
        return Object.values(DIRECTION).includes(direction);
    }

    function isValidGameId(gameId) {
        return Number.isInteger(gameId);
    }
}

function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

module.exports = { parseClientMessage };
