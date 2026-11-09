import js from "@eslint/js";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import globals from "globals";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default defineConfig([
    includeIgnoreFile(gitignorePath),
    js.configs.recommended,
    {
        files: ["index.js", "server/**/*.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: globals.node,
        },
    },
    {
        files: ["client/**/*.js"],
        languageOptions: {
            globals: globals.browser,
        },
    },
    {
        files: ["shared/**/*.js"],
        languageOptions: {
            globals: globals["shared-node-browser"],
        },
    },
    {
        files: ["test/**/*.js", "*.mjs"],
        languageOptions: {
            globals: globals.node,
        },
    },
]);
