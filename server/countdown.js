/**
 * The countdown of a game: the timer that ends it and the deadline the remaining time is derived from, so the two can't
 * differ. The deadline is read from the monotonic clock of the server, which doesn't jump like the system clock.
 */
class Countdown {
    /**
     * @param onTimeLimit Called when the time limit of a started countdown runs out.
     */
    constructor(onTimeLimit) {
        this.onTimeLimit = onTimeLimit;
        this.timer = null;
        // A deadline of 0 has passed already, so a countdown that doesn't run has no time left.
        this.deadline = 0;
    }

    /**
     * Starts the countdown from the beginning. A countdown that runs is stopped, so only one timer exists.
     * @param timeLimitMs The time until onTimeLimit is called, in milliseconds.
     */
    start(timeLimitMs) {
        clearTimeout(this.timer);
        this.deadline = performance.now() + timeLimitMs;
        this.timer = setTimeout(this.onTimeLimit, timeLimitMs);
    }

    /**
     * Stops the countdown, if it runs. onTimeLimit isn't called then.
     */
    stop() {
        clearTimeout(this.timer);
        this.deadline = 0;
    }

    /**
     * The time left in whole milliseconds, 0 when the countdown doesn't run. Clients count it from the moment they
     * receive it, so it isn't affected by a difference between the clocks of the server and the client.
     */
    remainingMs() {
        return Math.max(0, Math.round(this.deadline - performance.now()));
    }
}

module.exports = Countdown;
