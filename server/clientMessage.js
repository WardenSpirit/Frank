const { DIRECTION, MESSAGE_TYPE } = require('../shared/protocol.json');
const { parseSettings } = require('../shared/settings.js');

/**
 * Parses and validates a message received from a client.
 * @param text The text of a text frame the client sent.
 * @returns The message with only the fields its type specifies, or null if the message isn't valid. A MOVE may have
 *     fields its type doesn't specify, a SETTINGS may not.
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
        case MESSAGE_TYPE.SETTINGS:
            return parseSettingsMessage(message);
        default:
            return null;
    }

    function parseMove(clearData) {
        if (!isObject(clearData) || !isValidDirection(clearData.direction) || !isValidGameId(clearData.gameId)) {
            return null;
        }
        return { type: MESSAGE_TYPE.MOVE, clearData: { direction: clearData.direction, gameId: clearData.gameId } };
    }

    function parseSettingsMessage(message) {
        if (!Object.keys(message).every(field => field === 'type' || field === 'clearData')) {
            return null;
        }
        const settings = parseSettings(message.clearData);
        return settings === null ? null : { type: MESSAGE_TYPE.SETTINGS, clearData: settings };
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
