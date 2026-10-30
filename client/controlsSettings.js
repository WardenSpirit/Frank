import * as settings from "./settings.js";
import * as view from "./view/view.js";
import {
    APPLY_BUTTON_BOUNDS,
    CLOSE_BUTTON_BOUNDS
} from "./view/renderer/settingsRenderer.js";
import { settingsCanvas } from "./view/renderer/drawingContext.js";

/**
 * Whether the settings form is currently open.
 */
export function isOpen() {
    return settings.isSettingsOpen();
}

/**
 * Opens or closes the settings form.
 */
export function toggleSettings() {
    const nowOpen = settings.toggleSettingsForm();

    if (nowOpen) {
        view.renderSettings();
    } else {
        view.clearSettings();
    }
}

/**
 * Handles keyboard shortcuts while settings are open.
 * The S key toggles settings even when the form is closed.
 * Returns true if the key was handled, so the calling controller
 * can stop processing the same keyboard event.
 *
 * @param e A key down event.
 */
export function handleKeyDown(e) {
    if (e.code === "KeyS") {
        e.preventDefault();
        toggleSettings();
        return true;
    }

    if (!isOpen()) {
        return false;
    }

    switch (e.code) {
        case "Escape":
            e.preventDefault();
            handleEscapeKey();
            return true;

        case "Enter":
            e.preventDefault();
            handleEnterKey();
            return true;

        default:
            return false;
    }
}

const directionActions = {
    up: () => settings.moveHighlight(-1),
    down: () => settings.moveHighlight(1),
    left: () => settings.stepHighlightedSetting(-1),
    right: () => settings.stepHighlightedSetting(1)
};

/**
 * Handles directional input while settings are open.
 *
 * @param direction The intended direction of movement.
 */
export function handleDirection(direction) {
    const action = directionActions[direction];

    if (!action) {
        return;
    }

    action();
    view.renderSettings();
}

/**
 * Handles a tap on the settings canvas.
 * Returns true if an action button was handled.
 *
 * @param {number} clientX The horizontal coordinate of the tap.
 * @param {number} clientY The vertical coordinate of the tap.
 * @returns {boolean} Whether an action button was handled.
 */
export function handleTap(clientX, clientY) {
    const rect = settingsCanvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
        return false;
    }

    const point = {
        x: ((clientX - rect.left) / rect.width) * settingsCanvas.width,
        y: ((clientY - rect.top) / rect.height) * settingsCanvas.height
    };

    if (isInsideBounds(point, APPLY_BUTTON_BOUNDS)) {
        apply();
        return true;
    }

    if (isInsideBounds(point, CLOSE_BUTTON_BOUNDS)) {
        close();
        return true;
    }

    return false;
}

/**
 * Checks whether a point is inside a rectangle.
 *
 * @param point The point to check.
 * @param bounds The rectangle boundaries.
 */
function isInsideBounds(point, bounds) {
    return point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height;
}

/**
 * Handles the Escape key by closing settings and clearing the canvas.
 */
export function handleEscapeKey() {
    close();
}

/**
 * Applies or closes settings according to the highlighted item.
 */
export function handleEnterKey() {
    const item = settings.getHighlightedItem();

    if (item === "APPLY") {
        apply();
    } else if (item === "CLOSE") {
        close();
    }
}

/**
 * Applies the settings and clears the settings canvas.
 */
function apply() {
    settings.submitSettingsForm();
    view.clearSettings();
}

/**
 * Closes the settings form and clears the settings canvas.
 */
function close() {
    settings.closeSettingsForm();
    view.clearSettings();
}