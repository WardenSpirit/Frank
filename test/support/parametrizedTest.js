import { test } from "vitest";
import { readFileSync } from "node:fs";

export function parseBoolean(value) {
    if (value !== "true" && value !== "false") {
        throw new TypeError(`Invalid boolean: ${JSON.stringify(value)}`);
    }
    return value === "true";
}

export function parseNumber(value) {
    if (typeof value !== "string" || !/^-?\d+([.,]\d+)?$/.test(value)) {
        throw new TypeError(`Invalid decimal number: ${JSON.stringify(value)}`);
    }
    const number = Number(value.replace(",", "."));
    if (!Number.isFinite(number)) {
        throw new TypeError(`Invalid decimal number: ${JSON.stringify(value)}`);
    }
    return number;
}

// Project CSV adapter for Vitest's test.each:
// https://vitest.dev/api/test#test-each
export default function parametrizedTest(name, fileName, runCase) {
    const contents = readFileSync(new URL(`../fixtures/${fileName}`, import.meta.url), "utf8");
    const [header, ...lines] = contents.trim().split(/\r?\n/);
    const columns = header.split(",");
    if (
        contents.includes('"') ||
        new Set(columns).size !== columns.length ||
        columns.some(column => !column) ||
        !columns.includes("name")
    ) {
        throw new Error(`${fileName}: expected unique column names including name; quoted cells are unsupported`);
    }
    const names = new Set();
    const cases = lines.map((line, index) => {
        const values = line.split(",");
        if (values.length !== columns.length || values.some(value => value === "")) {
            throw new Error(`${fileName}:${index + 2}: expected ${columns.length} non-empty cells`);
        }
        const testCase = Object.fromEntries(columns.map((column, columnIndex) => [column, values[columnIndex]]));
        if (names.has(testCase.name)) {
            throw new Error(`${fileName}:${index + 2}: duplicate name ${testCase.name}`);
        }
        names.add(testCase.name);
        return testCase;
    });
    if (cases.length === 0) {
        throw new Error(`${fileName}: expected at least one case`);
    }

    test.each(cases)(`${name}: $name`, runCase);
}
