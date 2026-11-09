import * as drawingContext from "./drawingContext.js";
import * as images from "../images.js";
import { FORM_ITEMS } from "../../settings.js";
import { drawBitmapText, measureBitmapText } from "./bitmapTextRenderer.js";

const ROW_CONFIGS = [
    { field: "actors", label: "goal and hero", icon: "SETTINGS_GOAL_ICON", y: 42 },
    { field: "tiles", label: "map", icon: "SETTINGS_MAP_ICON", y: 63 },
    { field: "mapSize", label: "map size", icon: "SETTINGS_SIZE_ICON", y: 83 },
    { field: "holeRatio", label: "hole ratio", icon: "SETTINGS_PERCENTAGE_ICON", y: 103 },
    { field: "maxPlayers", label: "players", icon: "SETTINGS_PLAYER_ICON", y: 123 },
    { field: "timeLimit", label: "time limit", icon: "SETTINGS_HOURGLASS_ICON", y: 143 },
];

export const APPLY_BUTTON_BOUNDS = {
    x: 33,
    y: 173,
    width: 64,
    height: 24,
};

export const CLOSE_BUTTON_BOUNDS = {
    x: 110,
    y: 173,
    width: 64,
    height: 24,
};

// Load all images once when the module is initialized.
const BG_IMAGE = await images.getImage("SETTINGS_BG");
const CHAR_IMAGE = await images.getImage("CHARACTERS");
const LEFT_ARROW = await images.getImage("SETTINGS_LEFT_ARR");
const RIGHT_ARROW = await images.getImage("SETTINGS_RIGHT_ARR");
const TEXT_BUTTON = await images.getImage("SETTINGS_TEXT_BTN");
const TEXT_BUTTON_DIM = await images.getImage("SETTINGS_TEXT_BTN_DIM");
const APPLY_BUTTON = await images.getImage("SETTINGS_APPLY_DARK");
const APPLY_BUTTON_DIM = await images.getImage("SETTINGS_APPLY_DIM");
const CLOSE_BUTTON = await images.getImage("SETTINGS_CLOSE_DARK");
const CLOSE_BUTTON_DIM = await images.getImage("SETTINGS_CLOSE_DIM");

const ROW_IMAGES = await Promise.all(
    ROW_CONFIGS.map(async row => ({
        ...row,
        image: await images.getImage(row.icon),
    })),
);

export function renderSettingsForm(editedSettings, highlightedIndex) {
    const ctx = drawingContext.settingsContext;
    const canvas = drawingContext.settingsCanvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(BG_IMAGE, 0, 0, 224, 224);

    const title = "settings";
    const titleWidth = measureBitmapText(title);

    drawBitmapText(ctx, CHAR_IMAGE, title, Math.floor((224 - titleWidth) / 2), 18);

    for (let i = 0; i < ROW_IMAGES.length; i++) {
        const row = ROW_IMAGES[i];
        const isHighlighted = FORM_ITEMS[highlightedIndex] === row.field;

        if (isHighlighted) {
            ctx.fillStyle = "rgba(158, 82, 49, 0.35)";
            ctx.fillRect(14, row.y - 1, 196, 18);
        }

        ctx.drawImage(row.image, 16, row.y, 16, 16);

        drawBitmapText(ctx, CHAR_IMAGE, row.label, 35, row.y + 4);

        ctx.drawImage(LEFT_ARROW, 148, row.y, 16, 16);
        ctx.drawImage(isHighlighted ? TEXT_BUTTON : TEXT_BUTTON_DIM, 162, row.y, 32, 16);
        ctx.drawImage(RIGHT_ARROW, 193, row.y, 16, 16);

        const rawValue = String(editedSettings[row.field]);

        ctx.save();
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = isHighlighted ? "#2B1109" : "#F3DFC1";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(rawValue, 178, row.y + 8);
        ctx.restore();
    }

    const applyHighlighted = FORM_ITEMS[highlightedIndex] === "APPLY";
    const closeHighlighted = FORM_ITEMS[highlightedIndex] === "CLOSE";

    ctx.drawImage(
        applyHighlighted ? APPLY_BUTTON_DIM : APPLY_BUTTON,
        APPLY_BUTTON_BOUNDS.x,
        APPLY_BUTTON_BOUNDS.y,
        APPLY_BUTTON_BOUNDS.width,
        APPLY_BUTTON_BOUNDS.height,
    );

    const applyText = "apply";

    drawBitmapText(
        ctx,
        CHAR_IMAGE,
        applyText,
        APPLY_BUTTON_BOUNDS.x + Math.floor((APPLY_BUTTON_BOUNDS.width - measureBitmapText(applyText)) / 2),
        APPLY_BUTTON_BOUNDS.y + 8,
    );

    ctx.drawImage(
        closeHighlighted ? CLOSE_BUTTON_DIM : CLOSE_BUTTON,
        CLOSE_BUTTON_BOUNDS.x,
        CLOSE_BUTTON_BOUNDS.y,
        CLOSE_BUTTON_BOUNDS.width,
        CLOSE_BUTTON_BOUNDS.height,
    );

    const closeText = "close";

    drawBitmapText(
        ctx,
        CHAR_IMAGE,
        closeText,
        CLOSE_BUTTON_BOUNDS.x + Math.floor((CLOSE_BUTTON_BOUNDS.width - measureBitmapText(closeText)) / 2),
        CLOSE_BUTTON_BOUNDS.y + 8,
    );
}

export function clearSettingsForm() {
    drawingContext.settingsContext.clearRect(
        0,
        0,
        drawingContext.settingsCanvas.width,
        drawingContext.settingsCanvas.height,
    );
}
