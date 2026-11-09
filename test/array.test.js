import { test, expect } from "vitest";
import parametrizedTest, { parseNumber } from "./support/parametrizedTest.js";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getRandomIndex, getRandomElement } = require("../server/array");

parametrizedTest("getRandomIndex selects an index within the array", "array-index.csv", testCase => {
    // Arrange
    const values = Array.from({ length: parseNumber(testCase.length) }, (_, index) => index);
    const random = () => parseNumber(testCase.random);
    const expected = parseNumber(testCase.expectedIndex);

    // Act
    const actual = getRandomIndex(values, random);

    // Assert
    expect(actual).toBe(expected);
});

test("getRandomElement returns the item at the selected index", () => {
    // Arrange
    const values = ["north", "east", "south"];
    const expected = "east";

    // Act
    const actual = getRandomElement(values, () => 0.5);

    // Assert
    expect(actual).toBe(expected);
});

test("getRandomElement works with a single item", () => {
    // Arrange
    const values = ["only"];
    const expected = "only";

    // Act
    const actual = getRandomElement(values, () => 0.99);

    // Assert
    expect(actual).toBe(expected);
});
