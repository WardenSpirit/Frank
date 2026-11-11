import { beforeEach, describe, expect, vi } from "vitest";
import parametrizedTest, { parseNumber } from "./support/parametrizedTest.js";

import settingsSchema from "../shared/settings.json" with { type: "json" };
import { SETTING_FIELDS, parseSettings } from "../shared/settings.js";

// A fresh instance of the module for each test, so the form state of one test doesn't leak into the next.
let settings;

// 2-way tests: 11
// 3-way tests: 33
// Mixed tests: 27
const datasets = [
    ["2-way uniform strength", "settingsForm-2Way.csv"],
    ["3-way uniform strength", "settingsForm-3Way.csv"],
    ["Mixed-strength", "settingsForm-mixed.csv"],
];

beforeEach(async () => {
    vi.resetModules();
    settings = await import("../client/settings.js");
});

// Converts a CSV row into a JavaScript settings object.
function settingsFromCase(testCase) {
    const result = {};

    for (const field of SETTING_FIELDS) {
        const value = testCase[field];

        result[field] = settingsSchema[field].type === "number" ? parseNumber(value) : value;
    }

    return result;
}

// Returns starting settings different from every target value.
function oppositeStartingSettings(targetSettings) {
    return {
        mapSize: targetSettings.mapSize === 5 ? 20 : 5,
        holeRatio: targetSettings.holeRatio === 0 ? 40 : 0,
        actors: targetSettings.actors === "cat" ? "snake" : "cat",
        tiles: targetSettings.tiles === "garden" ? "volcano" : "garden",
        maxPlayers: targetSettings.maxPlayers === 1 ? 10 : 1,
        timeLimit: targetSettings.timeLimit === 5 ? 120 : 5,
    };
}

/**
 * Selects a setting and increments it until the target value is reached.
 * The settings form handles wraparound automatically, so one full cycle through the field's domain visits every valid
 * value. If the target isn't reached within one cycle, it isn't reachable (it is outside the domain, or the form skips
 * a value), and the helper throws instead of looping forever.
 */
function stepFieldToValue(field, targetValue) {
    settings.setHighlightedItem(field);

    const schema = settingsSchema[field];
    const cycleLength = schema.type === "number" ? schema.max - schema.min + 1 : schema.values.length;

    for (let steps = 0; settings.getEditedSettings()[field] !== targetValue; steps++) {
        if (steps >= cycleLength) {
            throw new Error(
                `${field}: ${JSON.stringify(targetValue)} not reached in a full cycle of ${cycleLength} steps`,
            );
        }
        settings.stepHighlightedSetting(1);
    }
}

/**
 * Selects a complete CSV combination through the actual settings form.
 */
function editFormToSettings(expectedSettings) {
    for (const field of SETTING_FIELDS) {
        stepFieldToValue(field, expectedSettings[field]);
    }
}

describe.each(datasets)("%s combinatorial settings form submission", (coverageName, fileName) => {
    parametrizedTest(coverageName, fileName, testCase => {
        // Arrange
        const expectedSettings = settingsFromCase(testCase);
        const initialSettings = oppositeStartingSettings(expectedSettings);

        settings.receiveSettings(initialSettings);
        settings.openSettingsForm();

        // Act
        editFormToSettings(expectedSettings);

        const actualEdited = settings.getEditedSettings();
        const actualSubmitted = settings.submitSettingsForm();

        // Assert
        expect(actualEdited).toEqual(expectedSettings);
        expect(actualSubmitted).toEqual(expectedSettings);
        expect(parseSettings(actualSubmitted)).toEqual(expectedSettings);
        expect(settings.isSettingsOpen()).toBe(false);
    });
});
