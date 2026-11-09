import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["test/**/*.test.js"],
        coverage: {
            provider: "v8",
            include: [
                "server/array.js",
                "server/game.js",
                "server/gameFactory.js",
                "shared/settings.js",
                "client/settings.js",
                "server/clientMessage.js",
                "server/websocket.js",
                "server/listenHost.js",
            ],
            reporter: ["text", "cobertura"],
        },
    },
});
