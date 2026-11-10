import { test, expect, beforeEach, vi } from "vitest";
import { getDefaultSettings } from "../client/settings.js";

// The controller needs neither a server nor canvases to decide what Enter does.
vi.mock("../client/connection.js", () => ({ sendSettings: vi.fn(), isConnected: vi.fn() }));
vi.mock("../client/view/view.js", () => ({ renderSettings: vi.fn(), clearSettings: vi.fn() }));
vi.mock("../client/view/renderer/settingsRenderer.js", () => ({ APPLY_BUTTON_BOUNDS: {}, CLOSE_BUTTON_BOUNDS: {} }));
vi.mock("../client/view/renderer/drawingContext.js", () => ({ settingsCanvas: {} }));

// A fresh instance of the controller and of the form state for each test, so one test doesn't leak into the next.
let connection;
let view;
let settings;
let handleKeyDown;
let handleDirection;

beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    connection = await import("../client/connection.js");
    view = await import("../client/view/view.js");
    settings = await import("../client/settings.js");
    ({ handleKeyDown, handleDirection } = await import("../client/controlsSettings.js"));
});

function keyDown(code) {
    return handleKeyDown({ code, preventDefault: vi.fn() });
}

test("handleKeyDown leaves Enter unhandled and sends nothing while the form is closed", () => {
    // Arrange
    settings.receiveSettings(getDefaultSettings());
    keyDown("KeyS");
    handleDirection("right"); // changes 'actors' from 'cat' to 'snake'
    keyDown("Escape");

    // Act
    const actualHandled = keyDown("Enter");
    const actualOpen = settings.isSettingsOpen();

    // Assert
    expect(actualHandled).toBe(false);
    expect(actualOpen).toBe(false);
    expect(connection.sendSettings).not.toHaveBeenCalled();
});

test("handleKeyDown sends the edited settings on Apply with an open connection", () => {
    // Arrange
    connection.isConnected.mockReturnValue(true);
    settings.receiveSettings(getDefaultSettings());
    keyDown("KeyS");
    handleDirection("right"); // changes 'actors' from 'cat' to 'snake'
    const expectedSettings = { ...getDefaultSettings(), actors: "snake" };
    settings.setHighlightedItem("APPLY");

    // Act
    const actualHandled = keyDown("Enter");
    const actualOpen = settings.isSettingsOpen();

    // Assert
    expect(actualHandled).toBe(true);
    expect(actualOpen).toBe(false);
    expect(connection.sendSettings).toHaveBeenCalledOnce();
    expect(connection.sendSettings).toHaveBeenCalledWith(expectedSettings);
    expect(view.clearSettings).toHaveBeenCalled();
});

test("handleKeyDown closes the form and drops the edits on Apply without an open connection", () => {
    // Arrange
    connection.isConnected.mockReturnValue(false);
    settings.receiveSettings(getDefaultSettings());
    keyDown("KeyS");
    handleDirection("right"); // changes 'actors' from 'cat' to 'snake'
    settings.setHighlightedItem("APPLY");

    // Act
    const actualHandled = keyDown("Enter");
    const actualOpen = settings.isSettingsOpen();
    keyDown("KeyS");
    const actualReopenedSettings = settings.getEditedSettings();

    // Assert
    expect(actualHandled).toBe(true);
    expect(actualOpen).toBe(false);
    expect(connection.sendSettings).not.toHaveBeenCalled();
    expect(view.clearSettings).toHaveBeenCalled();
    expect(actualReopenedSettings).toEqual(getDefaultSettings());
});
