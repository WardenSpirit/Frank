import settingsSchema from '../shared/settings.json' with { type: 'json' };

export const SETTING_FIELDS = [
    'actors',
    'tiles',
    'mapSize',
    'holeRatio',
    'maxPlayers',
    'timeLimit'
];

export const FORM_ITEMS = [
    ...SETTING_FIELDS,
    'APPLY',
    'CLOSE'
];

export function getDefaultSettings() {
    return Object.fromEntries(
        SETTING_FIELDS.map(field => [field, settingsSchema[field].default])
    );
}


let currentSettings = getDefaultSettings();
let editedSettings = { ...currentSettings };
let isOpen = false;
let highlightedIndex = 0;

/**
 * Changes the value of a single setting field by step (-1 or +1) with inclusive bounds wrapping.
 * @param {string} field Name of the field from shared/settings.json.
 * @param {number|string} currentValue Current value of the field.
 * @param {number} step Direction of change (-1 for left/decrease, +1 for right/increase).
 * @returns {number|string} The new wrapped value.
 */
export function changeSettingValue(field, currentValue, step) {
    const config = settingsSchema[field];
    if (!config) {
        throw new RangeError(`Unknown setting field: ${field}`);
    }
    if (step !== 1 && step !== -1) {
        throw new RangeError(`Invalid step: ${step}`);
    }

    if (config.type === 'number') {
        if (!Number.isInteger(currentValue) || currentValue < config.min || currentValue > config.max) {
            throw new RangeError(`Invalid value ${currentValue} for field ${field}`);
        }
        const rangeLength = config.max - config.min + 1;
        const offset = (currentValue - config.min + step + rangeLength) % rangeLength;
        return config.min + offset;
    }

    const index = config.values.indexOf(currentValue);
    if (index === -1) {
        throw new RangeError(`Invalid value ${currentValue} for field ${field}`);
    }
    const nextIndex = (index + step + config.values.length) % config.values.length;
    return config.values[nextIndex];
}

export function areSettingsEqual(first, second) {
    return SETTING_FIELDS.every(field => first[field] === second[field]);
}

/**
 * No-op placeholder for applying settings; #11 makes it send the settings to the server.
 * @param {object} _settings Object containing all setting fields.
 */
export function applySettings(_settings) {
    // No-op in #2; implemented in #11
}

export function isSettingsOpen() {
    return isOpen;
}

export function getCurrentSettings() {
    return { ...currentSettings };
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

export function openSettingsForm() {
    editedSettings = { ...currentSettings };
    highlightedIndex = 0;
    isOpen = true;
}

export function closeSettingsForm() {
    editedSettings = { ...currentSettings };
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

export function submitSettingsForm(onApply = applySettings) {
    if (!isOpen) {
        return false;
    }
    const changed = !areSettingsEqual(currentSettings, editedSettings);
    isOpen = false;
    if (changed) {
        currentSettings = { ...editedSettings };
        onApply({ ...currentSettings });
    }
    return changed;
}

export function resetSettingsStateForTests() {
    currentSettings = getDefaultSettings();
    editedSettings = { ...currentSettings };
    isOpen = false;
    highlightedIndex = 0;
}