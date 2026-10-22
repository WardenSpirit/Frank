import { test, expect } from 'vitest';
import { parseBoolean, parseNumber } from './support/parametrizedTest.js';

test.each([
    { value: 'true', expected: true },
    { value: 'false', expected: false }
])('parseBoolean accepts $value', testCase => {
    // Arrange
    const value = testCase.value;
    const expected = testCase.expected;

    // Act
    const actual = parseBoolean(value);

    // Assert
    expect(actual).toBe(expected);
});

test.each([
    { name: 'zero', value: '0', expected: 0 },
    { name: 'a negative integer', value: '-2', expected: -2 },
    { name: 'a fraction', value: '0.999', expected: 0.999 },
    { name: 'a decimal comma', value: '-1,25', expected: -1.25 }
])('parseNumber accepts $name', testCase => {
    // Arrange
    const value = testCase.value;
    const expected = testCase.expected;

    // Act
    const actual = parseNumber(value);

    // Assert
    expect(actual).toBe(expected);
});

test.each([
    { name: 'True', value: 'True' },
    { name: 'ture', value: 'ture' },
    { name: 'an empty cell', value: '' },
    { name: 'whitespace', value: ' ' },
    { name: 'a numeric boolean', value: '1' },
    { name: 'a missing value', value: undefined }
])('parseBoolean rejects $name', testCase => {
    // Arrange
    const value = testCase.value;
    const expected = TypeError;

    // Act
    let actual;
    try {
        parseBoolean(value);
    } catch (error) {
        actual = error;
    }

    // Assert
    expect(actual).toBeInstanceOf(expected);
});

test.each([
    { name: 'an empty cell', value: '' },
    { name: 'whitespace', value: ' ' },
    { name: 'abc', value: 'abc' },
    { name: 'NaN', value: 'NaN' },
    { name: 'Infinity', value: 'Infinity' },
    { name: 'a hexadecimal number', value: '0x10' },
    { name: 'multiple decimal points', value: '1.2.3' },
    { name: 'a missing value', value: undefined }
])('parseNumber rejects $name', testCase => {
    // Arrange
    const value = testCase.value;
    const expected = TypeError;

    // Act
    let actual;
    try {
        parseNumber(value);
    } catch (error) {
        actual = error;
    }

    // Assert
    expect(actual).toBeInstanceOf(expected);
});
