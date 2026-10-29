const { DIRECTION, MESSAGE_TYPE } = require('../shared/protocol.json');

/**
 * Parses and validates a message received from a client.
 * @param data The data of the web socket message.
 * @returns The message with only the fields its type specifies, or null if the message isn't valid.
 */
function parseClientMessage(data) {
    let message;
    try {
        message = JSON.parse(data);
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
        if (!isObject(clearData) || !isValidDirection(clearData.direction)) {
            return null;
        }
        return { type: MESSAGE_TYPE.MOVE, clearData: { direction: clearData.direction } };
    }

    function isValidDirection(direction) {
        return Object.values(DIRECTION).includes(direction);
    }
}

function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

module.exports = { parseClientMessage };
