import { test, expect, vi, beforeEach } from 'vitest';
import parametrizedTest, { parseNumber } from './support/parametrizedTest.js';
import settingsSchema from '../shared/settings.json' with { type: 'json' };
import {
    changeSettingValue,
    getDefaultSettings,
    openSettingsForm,
    closeSettingsForm,
    toggleSettingsForm,
    submitSettingsForm,
    stepHighlightedSetting,
    moveHighlight,
    setHighlightedItem,
    getHighlightedIndex,
    getHighlightedItem,
    getCurrentSettings,
    getEditedSettings,
    isSettingsOpen,
    resetSettingsStateForTests
} from '../client/settings.js';

function parseSettingValue(field, rawValue) {
    return settingsSchema[field].type === 'number' ? parseNumber(rawValue) : rawValue;
}

beforeEach(() => {
    resetSettingsStateForTests();
});

// 32 separate tests for EC/BV; each test name starts with the BV it covers
parametrizedTest(
    'changeSettingValue steps and wraps within field bounds',
    'settings-values.csv',
    testCase => {
        // Arrange
        const field = testCase.field;
        const currentValue = parseSettingValue(field, testCase.currentValue);
        const step = parseNumber(testCase.step);
        const expectedValue = parseSettingValue(field, testCase.expectedValue);

        // Act
        const actualValue = changeSettingValue(field, currentValue, step);

        // Assert
        expect(actualValue).toBe(expectedValue);
    }
);

test('submitSettingsForm calls applySettings with all fields when values changed', () => {
    // Arrange
    const spyApply = vi.fn();
    openSettingsForm();
    stepHighlightedSetting(1); // changes 'actors' from 'snake' to 'cat'
    const expectedSettings = {
        mapSize: 14,
        holeRatio: 33,
        actors: 'cat',
        tiles: 'volcano',
        maxPlayers: 10,
        timeLimit: 60
    };

    // Act
    const actualChanged = submitSettingsForm(spyApply);
    const actualOpen = isSettingsOpen();
    const actualCurrent = getCurrentSettings();

    // Assert
    expect(actualChanged).toBe(true);
    expect(actualOpen).toBe(false);
    expect(spyApply).toHaveBeenCalledTimes(1);
    expect(spyApply).toHaveBeenCalledWith(expectedSettings);
    expect(actualCurrent).toEqual(expectedSettings);
});

test('submitSettingsForm does not call applySettings when values are unchanged', () => {
    // Arrange
    const spyApply = vi.fn();
    openSettingsForm();

    // Act
    const actualChanged = submitSettingsForm(spyApply);
    const actualOpen = isSettingsOpen();

    // Assert
    expect(actualChanged).toBe(false);
    expect(actualOpen).toBe(false);
    expect(spyApply).not.toHaveBeenCalled();
});

test('closeSettingsForm discards unapplied edits and keeps previously applied values', () => {
    // Arrange
    openSettingsForm();
    moveHighlight(2); // highlight 'mapSize'
    stepHighlightedSetting(1); // edited mapSize = 15
    const expectedCurrent = {
        mapSize: 14,
        holeRatio: 33,
        actors: 'snake',
        tiles: 'volcano',
        maxPlayers: 10,
        timeLimit: 60
    };

    // Act
    closeSettingsForm();
    openSettingsForm();
    const actualCurrent = getCurrentSettings();
    const actualEditedAfterReopen = getEditedSettings();

    // Assert
    expect(actualCurrent).toEqual(expectedCurrent);
    expect(actualEditedAfterReopen).toEqual(expectedCurrent);
});

test('getDefaultSettings returns all configured default values', () => {
    // Arrange
    const expectedDefaults = {
        mapSize: 14,
        holeRatio: 33,
        actors: 'snake',
        tiles: 'volcano',
        maxPlayers: 10,
        timeLimit: 60
    };

    // Act
    const actualDefaults = getDefaultSettings();

    // Assert
    expect(actualDefaults).toEqual(expectedDefaults);
});

test('toggleSettingsForm opens and closes the form', () => {
    // Act
    const actualOpenedResult = toggleSettingsForm();
    const actualOpenAfterOpening = isSettingsOpen();
    const actualClosedResult = toggleSettingsForm();
    const actualOpenAfterClosing = isSettingsOpen();

    // Assert
    expect(actualOpenedResult).toBe(true);
    expect(actualOpenAfterOpening).toBe(true);
    expect(actualClosedResult).toBe(false);
    expect(actualOpenAfterClosing).toBe(false);
});

test('moveHighlight wraps from the first item to the last item', () => {
    // Arrange
    openSettingsForm(); // highlights the first item, 'actors'
    const expectedItem = 'CLOSE';

    // Act
    moveHighlight(-1);
    const actualItem = getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test('moveHighlight wraps from the last item to the first item', () => {
    // Arrange
    openSettingsForm();
    setHighlightedItem('CLOSE');
    const expectedItem = 'actors';

    // Act
    moveHighlight(1);
    const actualItem = getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test('moveHighlight does nothing when the form is closed', () => {
    // Arrange
    const expectedIndex = getHighlightedIndex();

    // Act
    const actualReturnedIndex = moveHighlight(1);
    const actualIndex = getHighlightedIndex();

    // Assert
    expect(actualReturnedIndex).toBe(expectedIndex);
    expect(actualIndex).toBe(expectedIndex);
});

test('setHighlightedItem selects a valid form item', () => {
    // Arrange
    openSettingsForm();
    const expectedItem = 'mapSize';

    // Act
    setHighlightedItem('mapSize');
    const actualItem = getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test('setHighlightedItem ignores an unknown item', () => {
    // Arrange
    openSettingsForm();
    const expectedIndex = getHighlightedIndex();

    // Act
    setHighlightedItem('UNKNOWN');
    const actualIndex = getHighlightedIndex();

    // Assert
    expect(actualIndex).toBe(expectedIndex);
});

test('stepHighlightedSetting does nothing when the form is closed', () => {
    // Arrange
    const expectedSettings = getEditedSettings();

    // Act
    stepHighlightedSetting(1);
    const actualSettings = getEditedSettings();

    // Assert
    expect(actualSettings).toEqual(expectedSettings);
});

test('stepHighlightedSetting switches from APPLY to CLOSE', () => {
    // Arrange
    openSettingsForm();
    setHighlightedItem('APPLY');
    const expectedItem = 'CLOSE';

    // Act
    stepHighlightedSetting(1);
    const actualItem = getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test('stepHighlightedSetting switches from CLOSE to APPLY', () => {
    // Arrange
    openSettingsForm();
    setHighlightedItem('CLOSE');
    const expectedItem = 'APPLY';

    // Act
    stepHighlightedSetting(1);
    const actualItem = getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test('submitSettingsForm does nothing when the form is closed', () => {
    // Arrange
    const spyApply = vi.fn();

    // Act
    const actualChanged = submitSettingsForm(spyApply);

    // Assert
    expect(actualChanged).toBe(false);
    expect(spyApply).not.toHaveBeenCalled();
});

test('openSettingsForm resets the highlight and discards previous edits', () => {
    // Arrange
    openSettingsForm();
    moveHighlight(2); // highlight 'mapSize'
    stepHighlightedSetting(1); // edited mapSize = 15
    const expectedIndex = 0;
    const expectedSettings = getDefaultSettings();

    // Act
    openSettingsForm();
    const actualIndex = getHighlightedIndex();
    const actualSettings = getEditedSettings();

    // Assert
    expect(actualIndex).toBe(expectedIndex);
    expect(actualSettings).toEqual(expectedSettings);
});