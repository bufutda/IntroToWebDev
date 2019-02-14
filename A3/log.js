/**
 * @file log.js
 * @overview Logging utilities
 * @author Mitchell Sawatzky
 */

const conf = require(`${__rootname}/conf.json`);

/**
 * Log a debug message
 * @function logDebug
 * @memberof log
 * @param {...string} args - the message(s) to log
 */
function logDebug(...args) {
    if (conf.logDebug) {
        console.log.call(this, '\x1b[34m[DEBUG]\x1b[0m', ...args);
    }
}

/**
 * Log an info message
 * @function logInfo
 * @memberof log
 * @param {...string} args - the message(s) to log
 */
function logInfo(...args) {
    if (conf.logInfo) {
        console.log.call(this, '\x1b[35m[INFO] \x1b[0m', ...args);
    }
}

/**
 * Log a warning message
 * @function logWarn
 * @memberof log
 * @param {...string} args - the message(s) to log
 */
function logWarn(...args) {
    if (conf.logWarn) {
        console.log.call(this, '\x1b[33m[WARN] \x1b[0m', ...args);
    }
}

/**
 * Log an error message and a stack trace
 * @function logError
 * @memberof log
 * @param {...string} args - the message(s) to log
 */
function logError(...args) {
    if (conf.logError) {
        let trace = (new Error()).stack.split('\n').slice(1).join('\n')
            .replace(/^/gm, '\x1b[31m[ERROR]\x1b[0m');
        console.error.call(this, '\x1b[31m[ERROR]\x1b[0m', ...args);
        console.error(trace);
    }
}

/**
 * @namespace log
 */
module.exports = {
    debug: logDebug,
    info: logInfo,
    warn: logWarn,
    error: logError
};
