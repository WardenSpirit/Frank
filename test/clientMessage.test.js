import { test, expect } from 'vitest';

import { createRequire } from 'node:module';
import { parseSettings } from '../shared/settings.js';

const require = createRequire(import.meta.url);
const { parseClientMessage } = require('../server/clientMessage');
const { MESSAGE_TYPE } = require('../shared/protocol.json');
const cases = require('./fixtures/client-messages.json');

function getData(testCase) {
    return 'data' in testCase ? testCase.data : JSON.stringify(testCase.message);
}

function parseJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

// SETTINGS whose validity depends only on clearData, so parseSettings accepts or rejects them as parseClientMessage does.
function isSettingsWithOnlyClearData(message) {
    return message?.type === MESSAGE_TYPE.SETTINGS
        && Object.hasOwn(message, 'clearData')
        && Object.keys(message).every(field => field === 'type' || field === 'clearData');
}

const settingsCases = cases.filter(testCase => isSettingsWithOnlyClearData(parseJson(getData(testCase))));

test.each(cases)('parseClientMessage: $id $name', testCase => {
    // Arrange
    const data = getData(testCase);
    const expected = testCase.expected;

    // Act
    const actual = parseClientMessage(data);

    // Assert
    expect(actual).toEqual(expected);
});

// The server requires shared/settings.js outside Vite, whose coverage only counts this import.
test.each(settingsCases)('parseSettings: $id $name', testCase => {
    // Arrange
    const clearData = JSON.parse(getData(testCase)).clearData;
    const expected = testCase.expected === null ? null : testCase.expected.clearData;

    // Act
    const actual = parseSettings(clearData);

    // Assert
    expect(actual).toEqual(expected);
});
