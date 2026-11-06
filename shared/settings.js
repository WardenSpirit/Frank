import SETTINGS_SCHEMA from './settings.json' with { type: 'json' };

// The client and the server both take the fields of the settings from here. Their order is the order of the form.
export const SETTING_FIELDS = Object.keys(SETTINGS_SCHEMA);

/**
 * @returns The settings of the first game: the default of every field in shared/settings.json.
 */
export function getDefaultSettings() {
    return Object.fromEntries(
        SETTING_FIELDS.map(field => [field, SETTINGS_SCHEMA[field].default])
    );
}

/**
 * Validates settings a client wants to apply against shared/settings.json.
 * @param value clearData of a SETTINGS message.
 * @returns A copy with every field of shared/settings.json, or null if a field is missing, unknown, of another type
 *     than the field's, a number that isn't an integer within the field's range, or a string the field doesn't allow.
 */
export function parseSettings(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null;
    }
    if (Object.keys(value).length !== SETTING_FIELDS.length || !SETTING_FIELDS.every(field => Object.hasOwn(value, field))) {
        return null;
    }
    if (!SETTING_FIELDS.every(field => isValidValue(SETTINGS_SCHEMA[field], value[field]))) {
        return null;
    }
    return Object.fromEntries(SETTING_FIELDS.map(field => [field, value[field]]));
}

function isValidValue(config, value) {
    if (typeof value !== config.type) {
        return false;
    }
    if (config.type === 'number') {
        return Number.isInteger(value) && value >= config.min && value <= config.max;
    }
    return config.values.includes(value);
}
