/**
 * Chooses the host the server listens on.
 * @param env The environment variables, for example process.env.
 * @returns LISTEN_HOST, or 127.0.0.1 if it is unset or empty.
 */
function getListenHost(env) {
    // || and not ??: Node.js listens on all interfaces when the host is an empty string.
    // HOST isn't read because it may hold the machine's hostname, which tcsh exports.
    return env.LISTEN_HOST || '127.0.0.1';
}

module.exports = { getListenHost };
