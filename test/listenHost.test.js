import { test, expect } from "vitest";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getListenHost } = require("../server/listenHost");

// Inline cases: the CSV loader rejects empty cells and can't express an unset variable.
test.each([
    { name: "LISTEN_HOST unset", env: {}, expected: "127.0.0.1" },
    { name: "LISTEN_HOST empty", env: { LISTEN_HOST: "" }, expected: "127.0.0.1" },
    { name: "LISTEN_HOST set to 0.0.0.0", env: { LISTEN_HOST: "0.0.0.0" }, expected: "0.0.0.0" },
    { name: "HOST set while LISTEN_HOST is unset", env: { HOST: "example" }, expected: "127.0.0.1" },
])("getListenHost: $name", testCase => {
    // Arrange
    const env = testCase.env;
    const expected = testCase.expected;

    // Act
    const actual = getListenHost(env);

    // Assert
    expect(actual).toBe(expected);
});
