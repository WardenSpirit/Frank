import settingsSchema from '../shared/settings.json' with { type: 'json' };
import { SETTING_FIELDS, getDefaultSettings } from '../shared/settings.js';

export { SETTING_FIELDS, getDefaultSettings };

export const FORM_ITEMS = [
    ...SETTING_FIELDS,
    'APPLY',
    'CLOSE'
];

// The settings of the last game; null until the first game comes and once the connection closes.
let activeSettings = null;
// The settings last sent in SETTINGS; null once a game with other settings comes or the connection closes.
let pendingSettings = null;
let editedSettings = null;
let isOpen = false;
let highlightedIndex = 0;

/**
 * Changes the value of a single setting field by step (-1 or +1) with inclusive bounds wrapping. The form only passes
 * fields of shared/settings.json, their valid values and steps of -1 or +1, so the arguments aren't checked; the server
 * validates the settings it receives.
 * @param {string} field Name of the field from shared/settings.json.
 * @param {number|string} currentValue Valid value of the field.
 * @param {number} step Direction of change (-1 for left/decrease, +1 for right/increase).
 * @returns {number|string} The new wrapped value.
 */
export function changeSettingValue(field, currentValue, step) {
    const config = settingsSchema[field];

    if (config.type === 'number') {
        const rangeLength = config.max - config.min + 1;
        const offset = (currentValue - config.min + step + rangeLength) % rangeLength;
        return config.min + offset;
    }

    const index = config.values.indexOf(currentValue);
    const nextIndex = (index + step + config.values.length) % config.values.length;
    return config.values[nextIndex];
}

export function isSettingsOpen() {
    return isOpen;
}

function areSettingsEqual(first, second) {
    return SETTING_FIELDS.every(field => first[field] === second[field]);
}

/**
 * Receives the settings of the game the server sent. If they differ from the active ones, they become active and the
 * pending ones are dropped; a game with the same settings may have been started before the pending ones arrived, so
 * they stay. Edits in an open form are kept; the form opens with the new settings next time.
 * @param {object} gameSettings Object containing all setting fields.
 */
export function receiveSettings(gameSettings) {
    if (activeSettings === null || !areSettingsEqual(activeSettings, gameSettings)) {
        activeSettings = gameSettings;
        pendingSettings = null;
    }
}

/**
 * Drops the active and pending settings once the connection closes, because no game can come anymore. The form then
 * behaves as before the first game: it opens with the default settings and submits nothing. Edits in an open form are
 * kept.
 */
export function dropSettings() {
    activeSettings = null;
    pendingSettings = null;
}

export function getEditedSettings() {
    return { ...editedSettings };
}

export function getHighlightedIndex() {
    return highlightedIndex;
}

export function getHighlightedItem() {
    return FORM_ITEMS[highlightedIndex];
}

/**
 * Opens the form with the pending settings, otherwise with the active ones, or with the default ones if no game has
 * come yet.
 */
export function openSettingsForm() {
    editedSettings = { ...(pendingSettings ?? activeSettings ?? getDefaultSettings()) };
    highlightedIndex = 0;
    isOpen = true;
}

export function closeSettingsForm() {
    isOpen = false;
}

export function toggleSettingsForm() {
    if (isOpen) {
        closeSettingsForm();
    } else {
        openSettingsForm();
    }
    return isOpen;
}

export function moveHighlight(step) {
    if (!isOpen) {
        return highlightedIndex;
    }
    const count = FORM_ITEMS.length;
    highlightedIndex = (highlightedIndex + step + count) % count;
    return highlightedIndex;
}

export function setHighlightedItem(itemName) {
    const index = FORM_ITEMS.indexOf(itemName);
    if (index !== -1) {
        highlightedIndex = index;
    }
}

export function stepHighlightedSetting(step) {
    if (!isOpen) {
        return;
    }
    const currentItem = FORM_ITEMS[highlightedIndex];
    if (SETTING_FIELDS.includes(currentItem)) {
        editedSettings[currentItem] = changeSettingValue(
            currentItem,
            editedSettings[currentItem],
            step
        );
    } else if (currentItem === 'APPLY' || currentItem === 'CLOSE') {
        highlightedIndex = currentItem === 'APPLY'
            ? FORM_ITEMS.indexOf('CLOSE')
            : FORM_ITEMS.indexOf('APPLY');
    }
}

/**
 * Closes the form. Changed settings become pending until the server sends a game with other settings; the active
 * settings stay.
 * @returns {object|null} A copy of the edited settings with all setting fields if a game has come, the connection
 *     hasn't closed since and they differ from the pending or active ones, otherwise null.
 */
export function submitSettingsForm() {
    isOpen = false;
    if (activeSettings === null) {
        return null;
    }
    const baseline = pendingSettings ?? activeSettings;
    if (areSettingsEqual(baseline, editedSettings)) {
        return null;
    }
    pendingSettings = { ...editedSettings };
    return { ...editedSettings };
}
