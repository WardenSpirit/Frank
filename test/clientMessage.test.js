import { test, expect } from 'vitest';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseClientMessage } = require('../server/clientMessage');
const cases = require('./fixtures/client-messages.json');

test.each(cases)('parseClientMessage: $id $name', testCase => {
    // Arrange
    const data = 'data' in testCase ? testCase.data : JSON.stringify(testCase.message);
    const expected = testCase.expected;

    // Act
    const actual = parseClientMessage(data);

    // Assert
    expect(actual).toEqual(expected);
});
