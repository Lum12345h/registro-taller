/**
 * Returns the current date and time in ISO 8601 format (e.g., "2023-10-27T10:00:00.000Z").
 * This format is standard and easily parsable.
 * @returns {string} Current date and time string.
 */
function getFechaActualISO() {
    return new Date().toISOString();
}