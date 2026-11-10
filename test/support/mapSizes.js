import settingsSchema from "../../shared/settings.json" with { type: "json" };

// Every map size the server can send, as cases for `test.each`. They include the sizes which don't divide 224, the size
// of the canvases in client/index.html, into whole pixels.
export const MAP_SIZES = Array.from(
    { length: settingsSchema.mapSize.max - settingsSchema.mapSize.min + 1 },
    (_, index) => ({ mapSize: settingsSchema.mapSize.min + index }),
);
