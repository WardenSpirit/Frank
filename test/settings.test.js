import { test, expect, beforeEach, vi } from "vitest";
import parametrizedTest, { parseNumber } from "./support/parametrizedTest.js";
import settingsSchema from "../shared/settings.json" with { type: "json" };
import { SETTING_FIELDS, changeSettingValue, getDefaultSettings } from "../client/settings.js";
import { parseSettings } from "../shared/settings.js";

// A fresh instance of the module for each test, so the form state of one test doesn't leak into the next.
let settings;

function parseSettingValue(field, rawValue) {
    return settingsSchema[field].type === "number" ? parseNumber(rawValue) : rawValue;
}

function allValidValues(config) {
    return config.type === "number"
        ? Array.from({ length: config.max - config.min + 1 }, (_, offset) => config.min + offset)
        : config.values;
}

beforeEach(async () => {
    vi.resetModules();
    settings = await import("../client/settings.js");
});

// 32 separate tests for EC/BV; each test name starts with the BV it covers
parametrizedTest("changeSettingValue steps and wraps within field bounds", "settings-values.csv", testCase => {
    // Arrange
    const field = testCase.field;
    const currentValue = parseSettingValue(field, testCase.currentValue);
    const step = parseNumber(testCase.step);
    const expectedValue = parseSettingValue(field, testCase.expectedValue);

    // Act
    const actualValue = changeSettingValue(field, currentValue, step);

    // Assert
    expect(actualValue).toBe(expectedValue);
});

// changeSettingValue doesn't check its arguments, so every value it can return from a valid one must pass the server.
test.each(SETTING_FIELDS)("changeSettingValue returns only values the server accepts for %s", field => {
    // Arrange
    const steps = [-1, 1];
    const expectedRejected = [];

    // Act
    const actualRejected = allValidValues(settingsSchema[field])
        .flatMap(currentValue => steps.map(step => ({ currentValue, step })))
        .map(({ currentValue, step }) => ({
            currentValue,
            step,
            newValue: changeSettingValue(field, currentValue, step),
        }))
        .filter(({ newValue }) => parseSettings({ ...getDefaultSettings(), [field]: newValue }) === null);

    // Assert
    expect(actualRejected).toEqual(expectedRejected);
});

test("submitSettingsForm returns the edited settings with all fields when values changed", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    const expectedSubmitted = {
        mapSize: 14,
        holeRatio: 33,
        actors: "snake",
        tiles: "garden",
        maxPlayers: 10,
        timeLimit: 60,
    };
    const expectedFields = Object.keys(settingsSchema).toSorted();

    // Act
    const actualSubmitted = settings.submitSettingsForm();
    const actualFields = Object.keys(actualSubmitted).toSorted();
    const actualOpen = settings.isSettingsOpen();

    // Assert
    expect(actualSubmitted).toEqual(expectedSubmitted);
    expect(actualFields).toEqual(expectedFields);
    expect(actualOpen).toBe(false);
});

test("openSettingsForm opens with the default settings before the first game comes", () => {
    // Arrange
    const expectedEdited = getDefaultSettings();

    // Act
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
});

test("submitSettingsForm returns null before the first game comes", () => {
    // Arrange
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'

    // Act
    const actualSubmitted = settings.submitSettingsForm();
    const actualOpen = settings.isSettingsOpen();

    // Assert
    expect(actualSubmitted).toBeNull();
    expect(actualOpen).toBe(false);
});

test("openSettingsForm opens with the pending settings until a game with other settings comes", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.submitSettingsForm();
    const expectedEdited = { ...getDefaultSettings(), actors: "snake" };

    // Act
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
});

test("submitSettingsForm returns null when the pending settings are applied again", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.submitSettingsForm();
    settings.openSettingsForm();

    // Act
    const actualSubmitted = settings.submitSettingsForm();

    // Assert
    expect(actualSubmitted).toBeNull();
});

test("submitSettingsForm returns an edit back to the active settings while other settings are pending", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.submitSettingsForm();
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'snake' back to 'cat'
    const expectedSubmitted = getDefaultSettings();

    // Act
    const actualSubmitted = settings.submitSettingsForm();

    // Assert
    expect(actualSubmitted).toEqual(expectedSubmitted);
});

test("receiveSettings drops the pending settings when a game with other settings comes", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.submitSettingsForm();
    const appliedSettings = { ...getDefaultSettings(), tiles: "volcano" };
    const expectedEdited = appliedSettings;

    // Act
    settings.receiveSettings(appliedSettings);
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
});

test("receiveSettings keeps the pending settings when a game with the same settings comes", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.submitSettingsForm();
    const expectedEdited = { ...getDefaultSettings(), actors: "snake" };

    // Act
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
});

test("dropSettings makes the form open with the default settings and submit nothing", () => {
    // Arrange
    settings.receiveSettings({ ...getDefaultSettings(), tiles: "volcano" });
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.submitSettingsForm();
    const expectedEdited = getDefaultSettings();

    // Act
    settings.dropSettings();
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    const actualSubmitted = settings.submitSettingsForm();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
    expect(actualSubmitted).toBeNull();
});

test("submitSettingsForm returns null when values are unchanged", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();

    // Act
    const actualSubmitted = settings.submitSettingsForm();
    const actualOpen = settings.isSettingsOpen();

    // Assert
    expect(actualSubmitted).toBeNull();
    expect(actualOpen).toBe(false);
});

test("submitSettingsForm judges changes against the settings of the last game", () => {
    // Arrange
    settings.receiveSettings({ ...getDefaultSettings(), actors: "snake" });
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'snake' to 'cat', the default
    const expectedSubmitted = getDefaultSettings();

    // Act
    const actualSubmitted = settings.submitSettingsForm();

    // Assert
    expect(actualSubmitted).toEqual(expectedSubmitted);
});

test("submitSettingsForm returns null when an edit equals the settings another player applied meanwhile", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.receiveSettings({ ...getDefaultSettings(), actors: "snake" });

    // Act
    const actualSubmitted = settings.submitSettingsForm();

    // Assert
    expect(actualSubmitted).toBeNull();
});

test("receiveSettings keeps the edits in an open form", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    settings.setHighlightedItem("mapSize");
    settings.stepHighlightedSetting(1); // edited mapSize = 15
    const appliedSettings = { ...getDefaultSettings(), tiles: "volcano" };
    const expectedEdited = { ...getDefaultSettings(), mapSize: 15 };
    const expectedSubmitted = expectedEdited;

    // Act
    settings.receiveSettings(appliedSettings);
    const actualEdited = settings.getEditedSettings();
    const actualSubmitted = settings.submitSettingsForm();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
    expect(actualSubmitted).toEqual(expectedSubmitted);
});

// The form opened before the first game starts from the defaults of the client, which must have every server field.
test("submitSettingsForm returns settings the server accepts after edits begun before the first game", () => {
    // Arrange
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.receiveSettings(getDefaultSettings());
    const submitted = settings.submitSettingsForm();
    const expectedParsed = { ...getDefaultSettings(), actors: "snake" };

    // Act
    const actualParsed = parseSettings(submitted);

    // Assert
    expect(actualParsed).toEqual(expectedParsed);
});

test("receiveSettings makes a closed form open with the new settings", () => {
    // Arrange
    const appliedSettings = { ...getDefaultSettings(), mapSize: 5, holeRatio: 0, timeLimit: 120 };
    const expectedEdited = appliedSettings;

    // Act
    settings.receiveSettings(appliedSettings);
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
});

test("closeSettingsForm discards edits against the settings of the last game", () => {
    // Arrange
    const appliedSettings = { ...getDefaultSettings(), maxPlayers: 3 };
    settings.receiveSettings(appliedSettings);
    settings.openSettingsForm();
    settings.setHighlightedItem("maxPlayers");
    settings.stepHighlightedSetting(1); // edited maxPlayers = 4
    const expectedEdited = appliedSettings;

    // Act
    settings.closeSettingsForm();
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
});

test("closeSettingsForm discards edits against the pending settings", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    settings.openSettingsForm();
    settings.stepHighlightedSetting(1); // changes 'actors' from 'cat' to 'snake'
    settings.submitSettingsForm();
    settings.openSettingsForm();
    settings.setHighlightedItem("mapSize");
    settings.stepHighlightedSetting(1); // edited mapSize = 15
    const expectedEdited = { ...getDefaultSettings(), actors: "snake" };

    // Act
    settings.closeSettingsForm();
    settings.openSettingsForm();
    const actualEdited = settings.getEditedSettings();

    // Assert
    expect(actualEdited).toEqual(expectedEdited);
});

test("getDefaultSettings returns all configured default values", () => {
    // Arrange
    const expectedDefaults = {
        mapSize: 14,
        holeRatio: 33,
        actors: "cat",
        tiles: "garden",
        maxPlayers: 10,
        timeLimit: 60,
    };

    // Act
    const actualDefaults = getDefaultSettings();

    // Assert
    expect(actualDefaults).toEqual(expectedDefaults);
});

test("getDefaultSettings returns settings the server accepts", () => {
    // Arrange
    const expectedParsed = getDefaultSettings();

    // Act
    const actualParsed = parseSettings(getDefaultSettings());

    // Assert
    expect(actualParsed).toEqual(expectedParsed);
});

test("toggleSettingsForm opens and closes the form", () => {
    // Act
    const actualOpenedResult = settings.toggleSettingsForm();
    const actualOpenAfterOpening = settings.isSettingsOpen();
    const actualClosedResult = settings.toggleSettingsForm();
    const actualOpenAfterClosing = settings.isSettingsOpen();

    // Assert
    expect(actualOpenedResult).toBe(true);
    expect(actualOpenAfterOpening).toBe(true);
    expect(actualClosedResult).toBe(false);
    expect(actualOpenAfterClosing).toBe(false);
});

test("moveHighlight wraps from the first item to the last item", () => {
    // Arrange
    settings.openSettingsForm(); // highlights the first item, 'actors'
    const expectedItem = "CLOSE";

    // Act
    settings.moveHighlight(-1);
    const actualItem = settings.getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test("moveHighlight wraps from the last item to the first item", () => {
    // Arrange
    settings.openSettingsForm();
    settings.setHighlightedItem("CLOSE");
    const expectedItem = "actors";

    // Act
    settings.moveHighlight(1);
    const actualItem = settings.getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test("moveHighlight does nothing when the form is closed", () => {
    // Arrange
    const expectedIndex = settings.getHighlightedIndex();

    // Act
    const actualReturnedIndex = settings.moveHighlight(1);
    const actualIndex = settings.getHighlightedIndex();

    // Assert
    expect(actualReturnedIndex).toBe(expectedIndex);
    expect(actualIndex).toBe(expectedIndex);
});

test("setHighlightedItem selects a valid form item", () => {
    // Arrange
    settings.openSettingsForm();
    const expectedItem = "mapSize";

    // Act
    settings.setHighlightedItem("mapSize");
    const actualItem = settings.getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test("setHighlightedItem ignores an unknown item", () => {
    // Arrange
    settings.openSettingsForm();
    const expectedIndex = settings.getHighlightedIndex();

    // Act
    settings.setHighlightedItem("UNKNOWN");
    const actualIndex = settings.getHighlightedIndex();

    // Assert
    expect(actualIndex).toBe(expectedIndex);
});

test("stepHighlightedSetting does nothing when the form is closed", () => {
    // Arrange
    const expectedSettings = settings.getEditedSettings();

    // Act
    settings.stepHighlightedSetting(1);
    const actualSettings = settings.getEditedSettings();

    // Assert
    expect(actualSettings).toEqual(expectedSettings);
});

test("stepHighlightedSetting switches from APPLY to CLOSE", () => {
    // Arrange
    settings.openSettingsForm();
    settings.setHighlightedItem("APPLY");
    const expectedItem = "CLOSE";

    // Act
    settings.stepHighlightedSetting(1);
    const actualItem = settings.getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test("stepHighlightedSetting switches from CLOSE to APPLY", () => {
    // Arrange
    settings.openSettingsForm();
    settings.setHighlightedItem("CLOSE");
    const expectedItem = "APPLY";

    // Act
    settings.stepHighlightedSetting(1);
    const actualItem = settings.getHighlightedItem();

    // Assert
    expect(actualItem).toBe(expectedItem);
});

test("openSettingsForm resets the highlight and discards previous edits", () => {
    // Arrange
    settings.openSettingsForm();
    settings.moveHighlight(2); // highlight 'mapSize'
    settings.stepHighlightedSetting(1); // edited mapSize = 15
    const expectedIndex = 0;
    const expectedSettings = getDefaultSettings();

    // Act
    settings.openSettingsForm();
    const actualIndex = settings.getHighlightedIndex();
    const actualSettings = settings.getEditedSettings();

    // Assert
    expect(actualIndex).toBe(expectedIndex);
    expect(actualSettings).toEqual(expectedSettings);
});
