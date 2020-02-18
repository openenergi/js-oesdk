const config = {};

// YYYY-MM-DDThh:mm:ss.sTZD (with milliseconds)
config.isoDateTimeWithMillisecondsPattern = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;
// YYYY-MM-DDThh:mm:ssTZD (no milliseconds)
config.isoDateTimeNoMillisecondsPattern = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)/;

config.uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/; // gi;

module.exports = config;
