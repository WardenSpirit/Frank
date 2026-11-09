import * as controlsGame from "./controlsGame.js";
import * as controlsSettings from "./controlsSettings.js";

const TOUCH_MOVE_THRESHOLD = 5;
const MULTI_TOUCH_MOVE_THRESHOLD = 15;
const LONG_TAP_MS = 400;

const keyDirections = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
};

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let maxTouchCount = 0;
let gestureCancelled = false;
let touchPositions = new Map();
let maxTouchMovement = 0;

document.addEventListener("touchstart", e => handleTouchStart(e));
document.addEventListener("touchmove", e => handleTouchMove(e));
document.addEventListener("touchend", e => handleTouchEnd(e));
document.addEventListener("touchcancel", e => handleTouchCancel(e));
document.body.addEventListener("keydown", e => handleKeyDown(e));

/**
 * Initializes the coordinates of the first touch and records the start time
 * for later usage when handling the touch end event.
 * Additional fingers must not overwrite these values.
 * The maximum number of fingers and their movement are tracked to distinguish
 * two-finger taps from multi-finger swipes and pinch gestures.
 *
 * @param e A touch start event.
 */
function handleTouchStart(e) {
    if (gestureCancelled) {
        return;
    }

    if (maxTouchCount === 0 && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }

    for (const touch of e.changedTouches) {
        touchPositions.set(touch.identifier, {
            x: touch.clientX,
            y: touch.clientY,
            maxMovement: 0,
        });
    }

    maxTouchCount = Math.max(maxTouchCount, e.touches.length);
}

/**
 * Tracks finger movement throughout the gesture.
 * This prevents a pinch or multi-finger swipe from being mistaken
 * for a two-finger tap.
 *
 * @param e A touch move event.
 */
function handleTouchMove(e) {
    if (gestureCancelled) {
        return;
    }

    for (const touch of e.changedTouches) {
        const start = touchPositions.get(touch.identifier);

        if (start === undefined) {
            continue;
        }

        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        start.maxMovement = Math.max(start.maxMovement, movement);
        maxTouchMovement = Math.max(maxTouchMovement, movement);
    }
}

/**
 * Resets the current gesture's state.
 */
function resetTouchState() {
    touchStartX = 0;
    touchStartY = 0;
    touchStartTime = 0;
    maxTouchCount = 0;
    maxTouchMovement = 0;
    touchPositions.clear();
}

/**
 * Cancels a gesture without executing its action.
 * If fingers remain on the screen, ignore the gesture until
 * all of them have been lifted.
 *
 * @param e A touch cancellation event.
 */
function handleTouchCancel(e) {
    resetTouchState();
    gestureCancelled = true;

    if (e.touches.length === 0) {
        gestureCancelled = false;
    }
}

/**
 * Compares the coordinates of the touch end event with the coordinates
 * of the touch start event and decides which move the user intended.
 * A gesture is evaluated only after all fingers have been released.
 * Two-finger taps toggle settings, regardless of which finger is released
 * first, while multi-finger swipes and pinches are ignored.
 *
 * @param e A touch end event.
 */
function handleTouchEnd(e) {
    if (gestureCancelled) {
        if (e.touches.length === 0) {
            gestureCancelled = false;
            resetTouchState();
        }

        return;
    }

    // Track the final position of each finger before it is released.
    handleTouchMove(e);

    // Do not evaluate a gesture until every finger has been lifted.
    if (e.touches.length > 0 || maxTouchCount === 0) {
        return;
    }

    const touchCount = maxTouchCount;
    const duration = Date.now() - touchStartTime;
    const startX = touchStartX;
    const startY = touchStartY;
    const end = e.changedTouches[0];

    const movement = maxTouchMovement;

    resetTouchState();

    if (!end) {
        return;
    }

    // Two-finger taps toggle settings; moving multi-finger gestures do nothing.
    if (touchCount === 2) {
        if (movement <= MULTI_TOUCH_MOVE_THRESHOLD) {
            controlsSettings.toggleSettings();
        }

        return;
    }

    // Ignore gestures involving three or more fingers.
    if (touchCount > 2) {
        return;
    }

    const deltaX = end.clientX - startX;
    const deltaY = end.clientY - startY;

    if (duration >= LONG_TAP_MS && movement <= TOUCH_MOVE_THRESHOLD) {
        // A stationary one-finger long tap toggles settings.
        controlsSettings.toggleSettings();
    } else if (Math.abs(deltaX) > Math.abs(deltaY) + TOUCH_MOVE_THRESHOLD) {
        dispatchDirection(deltaX > 0 ? "right" : "left");
    } else if (Math.abs(deltaY) > Math.abs(deltaX) + TOUCH_MOVE_THRESHOLD) {
        dispatchDirection(deltaY > 0 ? "down" : "up");
    } else {
        dispatchTap(end.clientX, end.clientY);
    }
}

/**
 * Sends directional input to the controller that owns the current screen.
 *
 * @param direction The intended direction of movement.
 */
function dispatchDirection(direction) {
    if (controlsSettings.isOpen()) {
        controlsSettings.handleDirection(direction);
    } else {
        controlsGame.handleDirection(direction);
    }
}

/**
 * Sends tap input to the appropriate controller.
 * A tap on a settings action button is handled by the settings controller;
 * otherwise, the tap toggles the background music.
 *
 * @param clientX The horizontal coordinate of the tap.
 * @param clientY The vertical coordinate of the tap.
 */
function dispatchTap(clientX, clientY) {
    if (controlsSettings.isOpen()) {
        const isButtonTapped = controlsSettings.handleTap(clientX, clientY);
        if (isButtonTapped) {
            return;
        }
    }

    controlsGame.handleTap();
}

/**
 * Handles keyboard shortcuts and directional input.
 * Modified shortcuts involving Ctrl, Meta or Alt are left untouched.
 * Music is handled globally, while other keys are delegated to the
 * controller responsible for the current screen.
 *
 * @param e A key down event.
 */
function handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
    }

    // Music can be toggled even while the settings form is open.
    if (e.code === "KeyM") {
        controlsGame.handleTap();
        return;
    }

    const direction = keyDirections[e.code];

    if (direction !== undefined) {
        e.preventDefault();
        dispatchDirection(direction);
        return;
    }

    controlsSettings.handleKeyDown(e);
}

/**
 * Allows the next game turn.
 */
export function allowTurn() {
    controlsGame.allowTurn();
}
