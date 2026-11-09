import { test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import { WebSocketServer } from "ws";
import GameClient from "./support/gameClient.js";
import gameAfterMove from "./support/gameAfterMove.js";
import pathToGameEnd from "./support/pathToGameEnd.js";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { onConnect } = require("../server/websocket");
const { getDefaultSettings } = require("../shared/settings.js");
const { CLOSE, DIRECTION, MESSAGE_TYPE } = require("../shared/protocol.json");

const CLOSE_CODE_INVALID_DATA = 1007;
const DEFAULT_SETTINGS = getDefaultSettings();
// Every field differs from the default; without holes the hero can only end the game at the treasure.
const CHANGED_SETTINGS = { mapSize: 5, holeRatio: 0, actors: "cat", tiles: "garden", maxPlayers: 5, timeLimit: 30 };
const OTHER_SETTINGS = { mapSize: 20, holeRatio: 40, actors: "snake", tiles: "garden", maxPlayers: 1, timeLimit: 120 };
const DEFAULT_TIME_LIMIT_MS = DEFAULT_SETTINGS.timeLimit * 1000;
const CHANGED_TIME_LIMIT_MS = CHANGED_SETTINGS.timeLimit * 1000;

let server;
let players = [];

beforeAll(async () => {
    server = new WebSocketServer({ port: 0 });
    server.on("connection", webSocket => onConnect(webSocket));
    await new Promise(resolve => server.once("listening", resolve));
});

// The server keeps the players, the turn and the settings in module state, so every test starts once all its players
// are gone and with the default settings. The real timers come back first, because vi.waitFor advances faked ones. The
// countdown of a game from a test that faked them stays faked, which clearTimeout doesn't mind: it does nothing, and
// the last player leaving still resets the countdown of the server, so no real timer is left.
afterEach(async () => {
    vi.useRealTimers();
    players.forEach(player => player.close());
    players = [];
    await vi.waitFor(() => expect(server.clients.size).toBe(0));
    await applySettingsAndLeave(DEFAULT_SETTINGS);
});

afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
});

/**
 * The server keeps the settings even when all players disconnect, so a client applies them and leaves before the
 * players of a test connect, and afterEach restores the defaults the same way.
 */
async function applySettingsAndLeave(settings) {
    const player = await GameClient.connect(server.address().port);
    await applySettings(player, settings);
    player.close();
    await vi.waitFor(() => expect(server.clients.size).toBe(0));
}

async function connectPlayer() {
    const player = await GameClient.connect(server.address().port);
    players.push(player);
    return player;
}

/**
 * For a player the server may reject. Call the methods that wait for server messages in the same tick.
 */
function openPlayer() {
    const player = GameClient.open(server.address().port);
    players.push(player);
    return player;
}

/**
 * Call in the same tick as openPlayer.
 * @returns A promise of the type and clearData of the first message the server sends to the player, GAME or REJECTED.
 */
function firstMessage(player) {
    return Promise.race(
        [MESSAGE_TYPE.GAME, MESSAGE_TYPE.REJECTED].map(type =>
            player.nextMessage(type).then(clearData => ({ type: type, clearData: clearData })),
        ),
    );
}

/**
 * Call in the same tick as openPlayer. A server that accepted the player wouldn't close the connection, so the promise
 * then resolves once the player gets GAME, and the test fails with a diff instead of a timeout.
 * @returns A promise of the close code and the reason the server sent, or null if the server accepted the player.
 */
function nextCloseUnlessAccepted(player) {
    return Promise.race([player.nextClose(), player.nextMessage(MESSAGE_TYPE.GAME).then(() => null)]);
}

/**
 * @returns The game the server started with the settings.
 */
async function applySettings(player, settings) {
    const game = player.nextMessage(MESSAGE_TYPE.GAME);
    player.sendSettings(settings);
    return await game;
}

function mapDimensions(game) {
    return { width: game.map.length, heights: game.map.map(column => column.length) };
}

function squareMap(size) {
    return { width: size, heights: Array(size).fill(size) };
}

/**
 * The player walks alone, so every turn has a single move and the hero follows the path exactly.
 * @returns The direction of the last step, which ends the game.
 */
async function walkToLastStep(player) {
    const path = pathToGameEnd(player.game);
    for (const direction of path.slice(0, -1)) {
        const moves = player.nextMessage(MESSAGE_TYPE.MOVES);
        player.sendMove(direction);
        await moves;
    }
    return path.at(-1);
}

/**
 * The server sets the countdown of a game with the global setTimeout, so the clock must be faked before the game
 * exists. Only the timers of the countdown and the clock the server reads the remaining time from are faked; the network and the ping of sync() don't depend on them.
 */
function fakeCountdownTimers() {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
}

/**
 * Moves the faked clock and waits until the players have received everything the elapsed countdown made the server send.
 * The server sends before it answers a ping, so waiting for a pong is enough.
 */
async function elapse(milliseconds, ...waitingPlayers) {
    vi.advanceTimersByTime(milliseconds);
    await Promise.all(waitingPlayers.map(player => player.sync()));
}

/**
 * Waits until the server has handled the disconnect of every player. Unlike vi.waitFor, it doesn't advance faked timers.
 */
async function untilNoPlayers() {
    while (server.clients.size > 0) {
        await new Promise(resolve => setImmediate(resolve));
    }
}

/**
 * Waits until the server has started closing the connection of every player, which it does right after it removes a
 * player it rejects. Unlike untilNoPlayers, it doesn't wait for a client that never answers the close frame.
 */
async function untilNoOpenPlayers() {
    while ([...server.clients].some(client => client.readyState === client.OPEN)) {
        await new Promise(resolve => setImmediate(resolve));
    }
}

/**
 * Like pathToGameEnd, it takes the rules of a move from the server's Game via gameAfterMove. On a map without holes, the
 * treasure is the only end of the game, and the hero has more neighbours than one.
 * @returns A direction in which the hero doesn't step onto the treasure, so the move doesn't end the game.
 */
function directionKeepingTheGameOn(game) {
    return Object.values(DIRECTION).find(direction => !gameAfterMove(game, direction).isGameBeingFinished());
}

test("EC23 EC27 BV11 a move of the only player for the current game ends the turn", async () => {
    // Arrange
    const player = await connectPlayer();
    const expected = [DIRECTION.UP];

    // Act
    const moves = player.nextMessage(MESSAGE_TYPE.MOVES);
    player.sendMove(DIRECTION.UP);
    const actual = await moves;

    // Assert
    expect(actual).toEqual(expected);
});

// Each case gets the gameId of the running game, so it is rejected only for the class it represents.
test.each([
    { id: "EC2", name: "a raw direction string", data: () => "UP" },
    { id: "EC2", name: "truncated JSON", data: () => '{"type":"MOVE"' },
    {
        id: "EC6",
        name: "a missing type",
        data: gameId => JSON.stringify({ clearData: { direction: DIRECTION.UP, gameId: gameId } }),
    },
    {
        id: "EC8",
        name: "an unknown type",
        data: gameId => JSON.stringify({ type: "JUMP", clearData: { direction: DIRECTION.UP, gameId: gameId } }),
    },
    {
        id: "EC12",
        name: "a move with the direction as clearData",
        data: () => JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: DIRECTION.UP }),
    },
    {
        id: "EC15",
        name: "a move in an unknown direction",
        data: gameId => JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: { direction: "NORTH", gameId: gameId } }),
    },
    {
        id: "EC25",
        name: "a move without a gameId",
        data: () => JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: { direction: DIRECTION.UP } }),
    },
    {
        id: "EC31",
        name: "a valid move in a binary frame",
        data: gameId =>
            Buffer.from(
                JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: { direction: DIRECTION.UP, gameId: gameId } }),
            ),
    },
])("$id the server rejects $name and closes the connection", async testCase => {
    // Arrange
    const player = await connectPlayer();
    const expected = { code: CLOSE.INVALID_MESSAGE.CODE, reason: CLOSE.INVALID_MESSAGE.REASON };

    // Act
    const closed = player.nextClose();
    player.sendRaw(testCase.data(player.game.gameId));
    const actual = await closed;

    // Assert
    expect(actual).toEqual(expected);
});

test("EC2 EC23 a rejected player doesn't block the turn of the others", async () => {
    // Arrange
    // An outdated client sends a raw direction and considers its move sent.
    const outdatedPlayer = await connectPlayer();
    const player = await connectPlayer();
    const expected = [DIRECTION.LEFT];

    // Act
    const moves = player.nextMessage(MESSAGE_TYPE.MOVES);
    outdatedPlayer.sendRaw(DIRECTION.UP);
    player.sendMove(DIRECTION.LEFT);
    const actual = await moves;

    // Assert
    expect(actual).toEqual(expected);
});

test("EC2 EC23 a rejected player that doesn't answer the close frame doesn't block the turn of the others", async () => {
    // Arrange
    const stalledPlayer = await connectPlayer();
    const player = await connectPlayer();
    const expected = [DIRECTION.LEFT];

    // Act
    const moves = player.nextMessage(MESSAGE_TYPE.MOVES);
    stalledPlayer.sendRaw(DIRECTION.UP);
    stalledPlayer.stopReading();
    player.sendMove(DIRECTION.LEFT);
    const actual = await moves;

    // Assert
    expect(actual).toEqual(expected);
});

test("EC32 the server closes the connection of a player that sends a text frame that isn't valid UTF-8", async () => {
    // Arrange
    const player = await connectPlayer();
    const expected = CLOSE_CODE_INVALID_DATA;

    // Act
    // The reason is the text of ws, which the protocol doesn't specify.
    const closed = player.nextClose();
    player.sendInvalidUtf8();
    const actual = (await closed).code;

    // Assert
    expect(actual).toEqual(expected);
});

test("EC23 EC32 a player that sends an invalid frame and doesn't answer the close frame doesn't block the turn of the others", async () => {
    // Arrange
    const stalledPlayer = await connectPlayer();
    const player = await connectPlayer();
    const expected = [DIRECTION.LEFT];

    // Act
    const moves = player.nextMessage(MESSAGE_TYPE.MOVES);
    stalledPlayer.sendInvalidUtf8();
    stalledPlayer.stopReading();
    player.sendMove(DIRECTION.LEFT);
    const actual = await moves;

    // Assert
    expect(actual).toEqual(expected);
});

test("EC2 the server doesn't record a move sent after a rejected message", async () => {
    // Arrange
    const rejectedPlayer = await connectPlayer();
    const player = await connectPlayer();
    const expected = [DIRECTION.LEFT];

    // Act
    // Both messages are on the way before the server closes the connection.
    const moves = player.nextMessage(MESSAGE_TYPE.MOVES);
    const closed = rejectedPlayer.nextClose();
    rejectedPlayer.sendRaw(DIRECTION.UP);
    rejectedPlayer.sendMove(DIRECTION.UP);
    await closed;
    player.sendMove(DIRECTION.LEFT);
    const actual = await moves;

    // Assert
    expect(actual).toEqual(expected);
});

test("BV8 BV9 the turn waits until every player has moved", async () => {
    // Arrange
    const firstPlayer = await connectPlayer();
    const secondPlayer = await connectPlayer();
    const expected = [DIRECTION.LEFT, DIRECTION.UP];

    // Act
    const moves = firstPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    firstPlayer.sendMove(DIRECTION.UP);
    secondPlayer.sendMove(DIRECTION.LEFT);
    const actual = await moves;

    // Assert
    // Moves of different players may arrive in either order.
    expect(actual.toSorted()).toEqual(expected);
});

test("EC21 the server ignores a second move of a player in the same turn", async () => {
    // Arrange
    const movingPlayer = await connectPlayer();
    const waitingPlayer = await connectPlayer();
    const expected = [DIRECTION.UP];

    // Act
    // Disconnecting ends the turn with the moves gathered so far; its messages are processed in the order they were sent.
    const moves = waitingPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    movingPlayer.sendMove(DIRECTION.UP);
    movingPlayer.sendMove(DIRECTION.DOWN);
    movingPlayer.close();
    const actual = await moves;

    // Assert
    expect(actual).toEqual(expected);
});

test("EC28 BV10 a move for the previous game has no effect on the new game", async () => {
    // Arrange
    const firstPlayer = await connectPlayer();
    const previousGame = firstPlayer.game;
    const lastDirection = await walkToLastStep(firstPlayer);
    const secondPlayer = await connectPlayer();
    const expected = {
        turnEndedBeforeSecondMove: false,
        endingTurn: [lastDirection, DIRECTION.RIGHT],
        newGameId: previousGame.gameId + 1,
        newGameTurn: [DIRECTION.LEFT, DIRECTION.DOWN],
    };

    // Act
    const endingTurn = firstPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    const newGame = firstPlayer.nextMessage(MESSAGE_TYPE.GAME);
    let turnEndedBeforeSecondMove = false;
    secondPlayer.nextMessage(MESSAGE_TYPE.MOVES).then(() => {
        turnEndedBeforeSecondMove = true;
    });
    // The second player's move ends the game, so the server drops the first player's move of the same turn.
    secondPlayer.sendMove(lastDirection, previousGame.gameId);
    await secondPlayer.sync();
    const actualTurnEndedBeforeSecondMove = turnEndedBeforeSecondMove;
    firstPlayer.sendMove(DIRECTION.RIGHT, previousGame.gameId);
    const actualEndingTurn = await endingTurn;
    const currentGame = await newGame;

    const newGameTurn = firstPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    firstPlayer.sendMove(DIRECTION.UP, previousGame.gameId);
    await firstPlayer.sync();
    firstPlayer.sendMove(DIRECTION.LEFT, currentGame.gameId);
    await firstPlayer.sync();
    secondPlayer.sendMove(DIRECTION.DOWN, currentGame.gameId);
    const actual = {
        turnEndedBeforeSecondMove: actualTurnEndedBeforeSecondMove,
        endingTurn: actualEndingTurn,
        newGameId: currentGame.gameId,
        newGameTurn: await newGameTurn,
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("EC28 BV10 a move for the previous game has no effect after a disconnect ends the game", async () => {
    // Arrange
    const movingPlayer = await connectPlayer();
    const previousGame = movingPlayer.game;
    const lastDirection = await walkToLastStep(movingPlayer);
    const leavingPlayer = await connectPlayer();
    const expected = {
        endingTurn: [lastDirection],
        newGameId: previousGame.gameId + 1,
        newGameTurn: [DIRECTION.LEFT],
    };

    // Act
    const endingTurn = movingPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    const newGame = movingPlayer.nextMessage(MESSAGE_TYPE.GAME);
    movingPlayer.sendMove(lastDirection, previousGame.gameId);
    await movingPlayer.sync();
    // The turn waits only for the leaving player, so disconnecting ends it and the game.
    leavingPlayer.close();
    const actualEndingTurn = await endingTurn;
    const currentGame = await newGame;

    const newGameTurn = movingPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    movingPlayer.sendMove(DIRECTION.UP, previousGame.gameId);
    await movingPlayer.sync();
    movingPlayer.sendMove(DIRECTION.LEFT, currentGame.gameId);
    const actual = {
        endingTurn: actualEndingTurn,
        newGameId: currentGame.gameId,
        newGameTurn: await newGameTurn,
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("EC29 BV12 the server ignores a move for a game that has not started yet", async () => {
    // Arrange
    const player = await connectPlayer();
    const expected = [DIRECTION.LEFT];

    // Act
    const moves = player.nextMessage(MESSAGE_TYPE.MOVES);
    player.sendMove(DIRECTION.UP, player.game.gameId + 1);
    player.sendMove(DIRECTION.LEFT);
    const actual = await moves;

    // Assert
    expect(actual).toEqual(expected);
});

test("the first game has the default settings and a map of the default mapSize", async () => {
    // Arrange
    const expected = { settings: DEFAULT_SETTINGS, map: squareMap(DEFAULT_SETTINGS.mapSize) };

    // Act
    const player = await connectPlayer();
    const actual = { settings: player.game.settings, map: mapDimensions(player.game) };

    // Assert
    expect(actual).toEqual(expected);
});

test("EC33 valid settings start a new game with them for all players", async () => {
    // Arrange
    const applyingPlayer = await connectPlayer();
    const otherPlayer = await connectPlayer();
    const previousGame = applyingPlayer.game;
    const expected = {
        gameId: previousGame.gameId + 1,
        settings: CHANGED_SETTINGS,
        map: squareMap(CHANGED_SETTINGS.mapSize),
        sameGameForBoth: true,
    };

    // Act
    const otherPlayersGame = otherPlayer.nextMessage(MESSAGE_TYPE.GAME);
    const game = await applySettings(applyingPlayer, CHANGED_SETTINGS);
    const actual = {
        gameId: game.gameId,
        settings: game.settings,
        map: mapDimensions(game),
        sameGameForBoth: JSON.stringify(await otherPlayersGame) === JSON.stringify(game),
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("EC50 settings equal to the current ones start a new game too", async () => {
    // Arrange
    const player = await connectPlayer();
    const previousGame = player.game;
    const expected = { gameId: previousGame.gameId + 1, settings: DEFAULT_SETTINGS };

    // Act
    const game = await applySettings(player, DEFAULT_SETTINGS);
    const actual = { gameId: game.gameId, settings: game.settings };

    // Assert
    expect(actual).toEqual(expected);
});

test("EC49 settings discard the moves of the turn, so a player who has moved can move again in the new game", async () => {
    // Arrange
    const applyingPlayer = await connectPlayer();
    const otherPlayer = await connectPlayer();
    const expected = { typesSinceNewGame: [], newGameTurn: [DIRECTION.DOWN, DIRECTION.LEFT] };

    // Act
    applyingPlayer.sendMove(DIRECTION.UP);
    await applySettings(applyingPlayer, CHANGED_SETTINGS);
    await otherPlayer.sync();
    const actualTypesSinceNewGame = otherPlayer.typesSinceLastGame();
    const newGameTurn = otherPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    applyingPlayer.sendMove(DIRECTION.LEFT);
    otherPlayer.sendMove(DIRECTION.DOWN);
    const actual = { typesSinceNewGame: actualTypesSinceNewGame, newGameTurn: (await newGameTurn).toSorted() };

    // Assert
    expect(actual).toEqual(expected);
});

test("a player who connects receives the running game with the current settings", async () => {
    // Arrange
    fakeCountdownTimers();
    const applyingPlayer = await connectPlayer();
    const game = await applySettings(applyingPlayer, CHANGED_SETTINGS);
    const expected = { game: game, typesSinceGameOfApplyingPlayer: [MESSAGE_TYPE.PLAYERS] };

    // Act
    const connectingPlayer = await connectPlayer();
    await applyingPlayer.sync();
    const actual = { game: connectingPlayer.game, typesSinceGameOfApplyingPlayer: applyingPlayer.typesSinceLastGame() };

    // Assert
    expect(actual).toEqual(expected);
});

test("the next game after a finished one keeps the settings", async () => {
    // Arrange
    const player = await connectPlayer();
    const previousGame = await applySettings(player, CHANGED_SETTINGS);
    const lastDirection = await walkToLastStep(player);
    const expected = {
        gameId: previousGame.gameId + 1,
        settings: CHANGED_SETTINGS,
        map: squareMap(CHANGED_SETTINGS.mapSize),
    };

    // Act
    const newGame = player.nextMessage(MESSAGE_TYPE.GAME);
    player.sendMove(lastDirection);
    const game = await newGame;
    const actual = { gameId: game.gameId, settings: game.settings, map: mapDimensions(game) };

    // Assert
    expect(actual).toEqual(expected);
});

test("a new game after all players disconnect and one connects keeps the settings", async () => {
    // Arrange
    const leavingPlayer = await connectPlayer();
    const previousGame = await applySettings(leavingPlayer, CHANGED_SETTINGS);
    leavingPlayer.close();
    await vi.waitFor(() => expect(server.clients.size).toBe(0));
    const expected = {
        gameId: previousGame.gameId + 1,
        settings: CHANGED_SETTINGS,
        map: squareMap(CHANGED_SETTINGS.mapSize),
    };

    // Act
    const player = await connectPlayer();
    const actual = { gameId: player.game.gameId, settings: player.game.settings, map: mapDimensions(player.game) };

    // Assert
    expect(actual).toEqual(expected);
});

// Each case changes one representative of a rejected class in otherwise valid settings. JSON leaves out a field whose
// value is undefined.
test.each([
    {
        id: "EC35",
        name: "an extra top-level field",
        message: { type: MESSAGE_TYPE.SETTINGS, clearData: CHANGED_SETTINGS, extra: 7 },
    },
    { id: "EC37", name: "no clearData", message: { type: MESSAGE_TYPE.SETTINGS } },
    {
        id: "EC40",
        name: "a missing field",
        message: { type: MESSAGE_TYPE.SETTINGS, clearData: { ...CHANGED_SETTINGS, timeLimit: undefined } },
    },
    {
        id: "EC41",
        name: "an unknown field",
        message: { type: MESSAGE_TYPE.SETTINGS, clearData: { ...CHANGED_SETTINGS, extra: 7 } },
    },
    {
        id: "EC44",
        name: "a fractional number",
        message: { type: MESSAGE_TYPE.SETTINGS, clearData: { ...CHANGED_SETTINGS, mapSize: 5.5 } },
    },
    {
        id: "EC45",
        name: "a number as a string",
        message: { type: MESSAGE_TYPE.SETTINGS, clearData: { ...CHANGED_SETTINGS, mapSize: "5" } },
    },
    {
        id: "EC47",
        name: "an unknown string",
        message: { type: MESSAGE_TYPE.SETTINGS, clearData: { ...CHANGED_SETTINGS, actors: "dog" } },
    },
    {
        id: "BV16",
        name: "mapSize above the maximum",
        message: { type: MESSAGE_TYPE.SETTINGS, clearData: { ...CHANGED_SETTINGS, mapSize: 21 } },
    },
])(
    "$id the server rejects settings with $name, closes the connection and the game continues for the others",
    async testCase => {
        // Arrange
        const player = await connectPlayer();
        const rejectedPlayer = await connectPlayer();
        const game = player.game;
        const expected = {
            close: { code: CLOSE.INVALID_MESSAGE.CODE, reason: CLOSE.INVALID_MESSAGE.REASON },
            game: game,
            turn: [DIRECTION.UP],
        };

        // Act
        const closed = rejectedPlayer.nextClose();
        rejectedPlayer.sendMessage(testCase.message);
        const actualClose = await closed;
        const turn = player.nextMessage(MESSAGE_TYPE.MOVES);
        player.sendMove(DIRECTION.UP);
        const actual = { close: actualClose, game: player.game, turn: await turn };

        // Assert
        expect(actual).toEqual(expected);
    },
);

// The applying player moves first; its settings and the other player's move then arrive in either order.
test.each([
    { id: "EC51", order: "the settings before the other move" },
    { id: "EC52", order: "the other move before the settings" },
])(
    "$id with $order, all players end with the same new game that no move of the previous game affects",
    async testCase => {
        // Arrange
        const applyingPlayer = await connectPlayer();
        const otherPlayer = await connectPlayer();
        const previousGame = applyingPlayer.game;
        const expected = {
            sameGameForBoth: true,
            settings: CHANGED_SETTINGS,
            map: squareMap(CHANGED_SETTINGS.mapSize),
            typesSinceNewGame: [[], []],
            newGameTurn: [DIRECTION.DOWN, DIRECTION.RIGHT],
        };

        // Act
        applyingPlayer.sendMove(DIRECTION.UP);
        await applyingPlayer.sync();
        if (testCase.id === "EC51") {
            applyingPlayer.sendSettings(CHANGED_SETTINGS);
            await applyingPlayer.sync();
            // The other player sent its move before the new game reached it.
            otherPlayer.sendMove(DIRECTION.LEFT, previousGame.gameId);
            await otherPlayer.sync();
        } else {
            otherPlayer.sendMove(DIRECTION.LEFT, previousGame.gameId);
            await otherPlayer.sync();
            applyingPlayer.sendSettings(CHANGED_SETTINGS);
            await applyingPlayer.sync();
        }
        await otherPlayer.sync();
        const game = applyingPlayer.game;
        const actualTypesSinceNewGame = [applyingPlayer.typesSinceLastGame(), otherPlayer.typesSinceLastGame()];
        const newGameTurn = applyingPlayer.nextMessage(MESSAGE_TYPE.MOVES);
        applyingPlayer.sendMove(DIRECTION.RIGHT);
        otherPlayer.sendMove(DIRECTION.DOWN);
        const actual = {
            sameGameForBoth: JSON.stringify(otherPlayer.game) === JSON.stringify(game),
            settings: game.settings,
            map: mapDimensions(game),
            typesSinceNewGame: actualTypesSinceNewGame,
            newGameTurn: (await newGameTurn).toSorted(),
        };

        // Assert
        expect(actual).toEqual(expected);
    },
);

test("EC53 of several settings, the server applies the ones it receives last", async () => {
    // Arrange
    const firstPlayer = await connectPlayer();
    const secondPlayer = await connectPlayer();
    const expected = { settings: [OTHER_SETTINGS, OTHER_SETTINGS], sameGameForBoth: true };

    // Act
    firstPlayer.sendSettings(CHANGED_SETTINGS);
    await firstPlayer.sync();
    secondPlayer.sendSettings(OTHER_SETTINGS);
    await secondPlayer.sync();
    await firstPlayer.sync();
    const actual = {
        settings: [firstPlayer.game.settings, secondPlayer.game.settings],
        sameGameForBoth: JSON.stringify(firstPlayer.game) === JSON.stringify(secondPlayer.game),
    };

    // Assert
    expect(actual).toEqual(expected);
});

// The players before the last two accepted ones connect in Arrange; with maxPlayers 1, only one player is accepted.
test.each([
    { ids: "EC54 EC55 BV22 BV36 BV37", maxPlayers: 1 },
    { ids: "EC54 EC55 BV23 BV35 BV36 BV37", maxPlayers: 10 },
])(
    "$ids with maxPlayers $maxPlayers, the server accepts players up to the limit and rejects the next one",
    async testCase => {
        // Arrange
        await applySettingsAndLeave({ ...DEFAULT_SETTINGS, maxPlayers: testCase.maxPlayers });
        const acceptedInAct = Math.min(testCase.maxPlayers, 2);
        for (let i = 0; i < testCase.maxPlayers - acceptedInAct; i++) {
            await connectPlayer();
        }
        const expected = {
            acceptedTypes: Array(acceptedInAct).fill(MESSAGE_TYPE.GAME),
            rejectedMessage: { type: MESSAGE_TYPE.REJECTED, clearData: null },
            rejectedClose: { code: CLOSE.REJECTED.CODE, reason: CLOSE.REJECTED.REASON },
            rejectedTypes: [MESSAGE_TYPE.REJECTED],
        };

        // Act
        // Each player connects once the previous one has got its first message.
        const actualAcceptedTypes = [];
        for (let i = 0; i < acceptedInAct; i++) {
            actualAcceptedTypes.push((await firstMessage(openPlayer())).type);
        }
        const rejectedPlayer = openPlayer();
        const rejectedMessage = firstMessage(rejectedPlayer);
        const closed = nextCloseUnlessAccepted(rejectedPlayer);
        const actual = {
            acceptedTypes: actualAcceptedTypes,
            rejectedMessage: await rejectedMessage,
            rejectedClose: await closed,
            rejectedTypes: rejectedPlayer.receivedTypes,
        };

        // Assert
        expect(actual).toEqual(expected);
    },
);

test("EC55 BV22 BV37 a rejected player whose connection is still closing changes neither the number of players nor the turn", async () => {
    // Arrange
    await applySettingsAndLeave({ ...DEFAULT_SETTINGS, maxPlayers: 1 });
    const player = await connectPlayer();
    const expected = { connections: 2, typesSinceGame: [MESSAGE_TYPE.PLAYERS], turnAfterOneMove: [DIRECTION.UP] };

    // Act
    // The server has handled the connection before the client sees it open. The client never answers the close frame,
    // so the server keeps the connection closing.
    const rejectedPlayer = openPlayer();
    await rejectedPlayer.onOpen(() => rejectedPlayer.stopReading());
    await player.sync();
    const actualTypesSinceGame = player.typesSinceLastGame();
    let actualTurn = null;
    player.nextMessage(MESSAGE_TYPE.MOVES).then(moves => {
        actualTurn = moves;
    });
    player.sendMove(DIRECTION.UP);
    await player.sync();
    // The server still holds the connection of the rejected player.
    const actual = {
        connections: server.clients.size,
        typesSinceGame: actualTypesSinceGame,
        turnAfterOneMove: actualTurn,
    };

    // Assert
    expect(actual).toEqual(expected);
});

// A rejected player sends as soon as its connection opens, before it reads the close frame. The server doesn't answer a
// ping once it has sent the close frame, so the tests wait for the close instead: the player answers the close frame
// after its message, and the server closes the connection only after the answer.
test("EC55 EC56 BV22 BV37 the server ignores a move of a rejected player for the running game", async () => {
    // Arrange
    await applySettingsAndLeave({ ...DEFAULT_SETTINGS, maxPlayers: 1 });
    const player = await connectPlayer();
    const expected = [DIRECTION.LEFT];

    // Act
    // A counted move would end the turn of the only player before the player moves.
    const moves = player.nextMessage(MESSAGE_TYPE.MOVES);
    const rejectedPlayer = openPlayer();
    const closed = nextCloseUnlessAccepted(rejectedPlayer);
    rejectedPlayer.onOpen(() => rejectedPlayer.sendMove(DIRECTION.UP, player.game.gameId));
    await closed;
    player.sendMove(DIRECTION.LEFT);
    const actual = await moves;

    // Assert
    expect(actual).toEqual(expected);
});

test("EC55 EC57 BV22 BV37 a rejected player that sends a text frame that isn't valid UTF-8 gets the normal close and the game goes on", async () => {
    // Arrange
    await applySettingsAndLeave({ ...DEFAULT_SETTINGS, maxPlayers: 1 });
    const player = await connectPlayer();
    const expected = {
        rejectedClose: { code: CLOSE.REJECTED.CODE, reason: CLOSE.REJECTED.REASON },
        turn: [DIRECTION.UP],
    };

    // Act
    // The server had sent its close frame before the invalid frame came, so the close code stays the normal one.
    const rejectedPlayer = openPlayer();
    const closed = nextCloseUnlessAccepted(rejectedPlayer);
    rejectedPlayer.onOpen(() => rejectedPlayer.sendInvalidUtf8());
    const actualRejectedClose = await closed;
    const turn = player.nextMessage(MESSAGE_TYPE.MOVES);
    player.sendMove(DIRECTION.UP);
    const actual = { rejectedClose: actualRejectedClose, turn: await turn };

    // Assert
    expect(actual).toEqual(expected);
});

test("EC59 settings with maxPlayers lower than the number of players keep every player in the new game", async () => {
    // Arrange
    const applyingPlayer = await connectPlayer();
    const otherPlayers = [await connectPlayer(), await connectPlayer()];
    const expected = {
        sameGameForAll: true,
        maxPlayers: 2,
        typesSinceGame: [[], [], []],
        turn: [DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.UP],
    };

    // Act
    const otherGames = otherPlayers.map(player => player.nextMessage(MESSAGE_TYPE.GAME));
    const game = await applySettings(applyingPlayer, { ...DEFAULT_SETTINGS, maxPlayers: 2 });
    const actualOtherGames = await Promise.all(otherGames);
    // A player the server dropped would make the others get PLAYERS and the turn end without its move.
    const allPlayers = [applyingPlayer, ...otherPlayers];
    await Promise.all(allPlayers.map(player => player.sync()));
    const actualTypesSinceGame = allPlayers.map(player => player.typesSinceLastGame());
    const turn = applyingPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    applyingPlayer.sendMove(DIRECTION.UP);
    otherPlayers[0].sendMove(DIRECTION.LEFT);
    otherPlayers[1].sendMove(DIRECTION.DOWN);
    const actual = {
        sameGameForAll: actualOtherGames.every(otherGame => JSON.stringify(otherGame) === JSON.stringify(game)),
        maxPlayers: game.settings.maxPlayers,
        typesSinceGame: actualTypesSinceGame,
        turn: (await turn).toSorted(),
    };

    // Assert
    expect(actual).toEqual(expected);
});

// The settings lower maxPlayers to 2 while 3 players are connected; leaving players then bring n from m + 1 to m − 1.
test.each([
    { ids: "EC58 BV38", leaving: 0, type: MESSAGE_TYPE.REJECTED },
    { ids: "EC55 BV37", leaving: 1, type: MESSAGE_TYPE.REJECTED },
    { ids: "EC54 BV36", leaving: 2, type: MESSAGE_TYPE.GAME },
])(
    "$ids when settings have lowered maxPlayers to 2 for 3 players and $leaving of them have left, a connecting player gets $type",
    async testCase => {
        // Arrange
        const connectedPlayers = [await connectPlayer(), await connectPlayer(), await connectPlayer()];
        await applySettings(connectedPlayers[0], { ...DEFAULT_SETTINGS, maxPlayers: 2 });
        connectedPlayers.slice(0, testCase.leaving).forEach(player => player.close());
        await vi.waitFor(() => expect(server.clients.size).toBe(connectedPlayers.length - testCase.leaving));
        const expected = testCase.type;

        // Act
        const actual = (await firstMessage(openPlayer())).type;

        // Assert
        expect(actual).toEqual(expected);
    },
);

test("EC60 when a player sends the close frame, the other players get PLAYERS and their turn ends while the connection is still closing", async () => {
    // Arrange
    const leavingPlayer = await connectPlayer();
    const [leavingConnection] = server.clients;
    const player = await connectPlayer();
    player.sendMove(DIRECTION.UP);
    await player.sync();
    const expected = { players: 1, turn: [DIRECTION.UP], connections: 2 };

    // Act
    let actualPlayers = null;
    let actualTurn = null;
    player.nextMessage(MESSAGE_TYPE.PLAYERS).then(count => {
        actualPlayers = count;
    });
    player.nextMessage(MESSAGE_TYPE.MOVES).then(moves => {
        actualTurn = moves;
    });
    // The player sends its close frame but never reads the answer, so the server keeps the connection closing.
    leavingPlayer.close();
    leavingPlayer.stopReading();
    await vi.waitFor(() => expect(leavingConnection.readyState).toBe(leavingConnection.CLOSING));
    await player.sync();
    // The server still holds the connection of the leaving player.
    const actual = { players: actualPlayers, turn: actualTurn, connections: server.clients.size };

    // Assert
    expect(actual).toEqual(expected);
});

test("EC54 EC60 BV22 BV36 with maxPlayers 1, the server accepts a player while the connection of the only other player is closing, and counts only the new player in PLAYERS and in the turn", async () => {
    // Arrange
    await applySettingsAndLeave({ ...DEFAULT_SETTINGS, maxPlayers: 1 });
    const leavingPlayer = await connectPlayer();
    const [leavingConnection] = server.clients;
    // The player sends its close frame but never reads the answer, so the server keeps the connection closing.
    leavingPlayer.close();
    leavingPlayer.stopReading();
    await vi.waitFor(() => expect(leavingConnection.readyState).toBe(leavingConnection.CLOSING));
    const expected = { type: MESSAGE_TYPE.GAME, connections: 2, players: 1, turnAfterOneMove: [DIRECTION.UP] };

    // Act
    const player = openPlayer();
    let actualPlayers = null;
    let actualTurn = null;
    player.nextMessage(MESSAGE_TYPE.PLAYERS).then(count => {
        actualPlayers = count;
    });
    const actualType = (await firstMessage(player)).type;
    player.nextMessage(MESSAGE_TYPE.MOVES).then(moves => {
        actualTurn = moves;
    });
    player.sendMove(DIRECTION.UP);
    await player.sync();
    // The server still holds the connection of the leaving player.
    const actual = {
        type: actualType,
        connections: server.clients.size,
        players: actualPlayers,
        turnAfterOneMove: actualTurn,
    };

    // Assert
    expect(actual).toEqual(expected);
});

// The countdown of the time limit runs on a faked clock, so the tests cover the exact millisecond. The IDs are from the
// section Time limit of test/README.md.

// The first game has the default settings; other settings start a new game with their time limit.
test.each([
    { ids: "TL-EC1 TL-EC2 TL-EC3 TL-EC8 TL-BV1 TL-BV2 TL-BV3", timeLimit: 5 },
    { ids: "TL-EC1 TL-EC2 TL-EC3 TL-EC8 TL-BV1 TL-BV2", timeLimit: DEFAULT_SETTINGS.timeLimit },
    { ids: "TL-EC1 TL-EC2 TL-EC3 TL-EC8 TL-BV1 TL-BV2 TL-BV4", timeLimit: 120 },
])("$ids a game with timeLimit $timeLimit lasts $timeLimit s, not a millisecond less", async testCase => {
    // Arrange
    fakeCountdownTimers();
    const player = await connectPlayer();
    const startedGame =
        testCase.timeLimit === DEFAULT_SETTINGS.timeLimit
            ? player.game
            : await applySettings(player, { ...DEFAULT_SETTINGS, timeLimit: testCase.timeLimit });
    const expected = {
        gameBeforeLimit: startedGame,
        timeoutGame: {
            gameId: startedGame.gameId + 1,
            timeout: true,
            settings: startedGame.settings,
            map: squareMap(startedGame.settings.mapSize),
        },
    };

    // Act
    await elapse(testCase.timeLimit * 1000 - 1, player);
    const actualGameBeforeLimit = player.game;
    await elapse(1, player);
    const actual = {
        gameBeforeLimit: actualGameBeforeLimit,
        timeoutGame: {
            gameId: player.game.gameId,
            timeout: player.game.timeout,
            settings: player.game.settings,
            map: mapDimensions(player.game),
        },
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("TL-EC3 TL-EC8 the timeout sends the same new game with the timeout to all players", async () => {
    // Arrange
    fakeCountdownTimers();
    const firstPlayer = await connectPlayer();
    const secondPlayer = await connectPlayer();
    const previousGame = firstPlayer.game;
    const expected = { gameId: previousGame.gameId + 1, timeout: true, sameGameForBoth: true };

    // Act
    await elapse(DEFAULT_TIME_LIMIT_MS, firstPlayer, secondPlayer);
    const actual = {
        gameId: firstPlayer.game.gameId,
        timeout: firstPlayer.game.timeout,
        sameGameForBoth: JSON.stringify(secondPlayer.game) === JSON.stringify(firstPlayer.game),
    };

    // Assert
    expect(actual).toEqual(expected);
});

// Each case starts a new game half way through the time limit of the first game. The countdown then lasts the whole
// time limit from the new game, so the first countdown doesn't end it sooner.
test.each([
    {
        ids: "TL-EC2 TL-EC3 TL-EC4 TL-BV1 TL-BV2",
        name: "the end of the game at the treasure or in a hole",
        timeout: false,
        startNewGame: async player => {
            const lastDirection = await walkToLastStep(player);
            const newGame = player.nextMessage(MESSAGE_TYPE.GAME);
            player.sendMove(lastDirection);
            return await newGame;
        },
    },
    {
        ids: "TL-EC2 TL-EC3 TL-EC4 TL-BV1 TL-BV2",
        name: "the departure of a player that completes a turn ending the game",
        timeout: false,
        startNewGame: async player => {
            const lastDirection = await walkToLastStep(player);
            const leavingPlayer = await connectPlayer();
            // The turn waits only for the leaving player, so the departure ends it and the game.
            player.sendMove(lastDirection);
            await player.sync();
            const newGame = player.nextMessage(MESSAGE_TYPE.GAME);
            leavingPlayer.close();
            return await newGame;
        },
    },
    {
        ids: "TL-EC2 TL-EC3 TL-EC5 TL-BV1 TL-BV2",
        name: "the settings",
        timeout: false,
        startNewGame: player => applySettings(player, DEFAULT_SETTINGS),
    },
    {
        ids: "TL-EC2 TL-EC3 TL-EC6 TL-BV1 TL-BV2",
        name: "a timeout",
        timeout: true,
        startNewGame: async player => {
            await elapse(DEFAULT_TIME_LIMIT_MS / 2, player);
            return player.game;
        },
    },
])("$ids the countdown restarts with a new game started by $name", async testCase => {
    // Arrange
    fakeCountdownTimers();
    const player = await connectPlayer();
    const firstGame = player.game;
    const expected = {
        newGame: { gameId: firstGame.gameId + 1, hasTimeoutField: testCase.timeout },
        gameIdBeforeLimit: firstGame.gameId + 1,
        timeoutGame: { gameId: firstGame.gameId + 2, timeout: true },
    };

    // Act
    await elapse(DEFAULT_TIME_LIMIT_MS / 2, player);
    const newGame = await testCase.startNewGame(player);
    await elapse(DEFAULT_TIME_LIMIT_MS - 1, player);
    const actualGameIdBeforeLimit = player.game.gameId;
    await elapse(1, player);
    const actual = {
        newGame: { gameId: newGame.gameId, hasTimeoutField: "timeout" in newGame },
        gameIdBeforeLimit: actualGameIdBeforeLimit,
        timeoutGame: { gameId: player.game.gameId, timeout: player.game.timeout },
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("TL-EC2 TL-EC7 TL-BV5 a turn finished a millisecond before the time limit passes and doesn't restart the countdown", async () => {
    // Arrange
    fakeCountdownTimers();
    const player = await connectPlayer();
    // The map has no holes, so the move can end the game only at the treasure.
    const game = await applySettings(player, CHANGED_SETTINGS);
    const direction = directionKeepingTheGameOn(game);
    const expected = {
        turn: [direction],
        gameIdAfterTurn: game.gameId,
        timeoutGame: { gameId: game.gameId + 1, timeout: true },
    };

    // Act
    await elapse(CHANGED_TIME_LIMIT_MS - 1, player);
    const turn = player.nextMessage(MESSAGE_TYPE.MOVES);
    player.sendMove(direction);
    const actualTurn = await turn;
    await player.sync();
    const actualGameIdAfterTurn = player.game.gameId;
    // The timeout comes a time limit after the start of the game, not after the turn.
    await elapse(1, player);
    const actual = {
        turn: actualTurn,
        gameIdAfterTurn: actualGameIdAfterTurn,
        timeoutGame: { gameId: player.game.gameId, timeout: player.game.timeout },
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("TL-EC10 TL-BV6 a move for the game that the timeout has ended has no effect on the new game", async () => {
    // Arrange
    fakeCountdownTimers();
    const player = await connectPlayer();
    const previousGame = player.game;
    const expected = {
        typesAfterMoveOfPreviousGame: [],
        newGameId: previousGame.gameId + 1,
        newGameTurn: [DIRECTION.LEFT],
    };

    // Act
    // The only player's move for the current game would end the turn and send MOVES.
    await elapse(DEFAULT_TIME_LIMIT_MS, player);
    const newGame = player.game;
    player.sendMove(DIRECTION.UP, previousGame.gameId);
    await player.sync();
    const actualTypesAfterMoveOfPreviousGame = player.typesSinceLastGame();
    const newGameTurn = player.nextMessage(MESSAGE_TYPE.MOVES);
    player.sendMove(DIRECTION.LEFT, newGame.gameId);
    const actual = {
        typesAfterMoveOfPreviousGame: actualTypesAfterMoveOfPreviousGame,
        newGameId: newGame.gameId,
        newGameTurn: await newGameTurn,
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("TL-EC9 the timeout discards the moves of the turn, so a player who has moved can move again in the new game", async () => {
    // Arrange
    fakeCountdownTimers();
    const movedPlayer = await connectPlayer();
    const otherPlayer = await connectPlayer();
    const expected = { typesAfterMoveOfOtherPlayer: [[], []], newGameTurn: [DIRECTION.DOWN, DIRECTION.LEFT] };

    // Act
    movedPlayer.sendMove(DIRECTION.UP);
    await movedPlayer.sync();
    await elapse(DEFAULT_TIME_LIMIT_MS, movedPlayer, otherPlayer);
    // The kept move of the previous game would end the turn together with this one and send MOVES.
    otherPlayer.sendMove(DIRECTION.LEFT);
    await otherPlayer.sync();
    await movedPlayer.sync();
    const actualTypesAfterMoveOfOtherPlayer = [movedPlayer.typesSinceLastGame(), otherPlayer.typesSinceLastGame()];
    const newGameTurn = movedPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    movedPlayer.sendMove(DIRECTION.DOWN);
    const actual = {
        typesAfterMoveOfOtherPlayer: actualTypesAfterMoveOfOtherPlayer,
        newGameTurn: (await newGameTurn).toSorted(),
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("TL-EC11 the countdown goes on when a player leaves and others stay", async () => {
    // Arrange
    fakeCountdownTimers();
    const stayingPlayer = await connectPlayer();
    const leavingPlayer = await connectPlayer();
    const previousGame = stayingPlayer.game;
    const expected = { players: 1, gameId: previousGame.gameId + 1, timeout: true };

    // Act
    // The count of the players after the connection of the leaving player has to arrive first, so it isn't mistaken
    // for the one after the disconnect.
    await stayingPlayer.sync();
    const playersAfterLeaving = stayingPlayer.nextMessage(MESSAGE_TYPE.PLAYERS);
    leavingPlayer.close();
    const actualPlayers = await playersAfterLeaving;
    await elapse(DEFAULT_TIME_LIMIT_MS, stayingPlayer);
    const actual = { players: actualPlayers, gameId: stayingPlayer.game.gameId, timeout: stayingPlayer.game.timeout };

    // Assert
    expect(actual).toEqual(expected);
});

// The server removes a rejected player and a player with an invalid frame right away, so these players don't answer the
// close frame, which would otherwise remove them on close.
test.each([
    {
        ids: "TL-EC12",
        name: "closes the connection",
        leave: async player => {
            player.close();
            await untilNoPlayers();
        },
    },
    {
        ids: "TL-EC12 EC2",
        name: "sends a rejected message and doesn't answer the close frame",
        leave: async player => {
            player.sendRaw(DIRECTION.UP);
            player.stopReading();
            await untilNoOpenPlayers();
        },
    },
    {
        ids: "TL-EC12 EC32",
        name: "sends a text frame that isn't valid UTF-8 and doesn't answer the close frame",
        leave: async player => {
            player.sendInvalidUtf8();
            player.stopReading();
            await untilNoOpenPlayers();
        },
    },
])("$ids no countdown runs after the last player $name, and the next player to connect starts one", async testCase => {
    // Arrange
    fakeCountdownTimers();
    const leavingPlayer = await connectPlayer();
    const previousGame = leavingPlayer.game;
    await testCase.leave(leavingPlayer);
    const expected = {
        gameId: previousGame.gameId + 1,
        gameIdBeforeLimit: previousGame.gameId + 1,
        timeoutGame: { gameId: previousGame.gameId + 2, timeout: true },
    };

    // Act
    // Several time limits pass with nobody connected.
    vi.advanceTimersByTime(3 * DEFAULT_TIME_LIMIT_MS);
    const player = await connectPlayer();
    const actualGameId = player.game.gameId;
    await elapse(DEFAULT_TIME_LIMIT_MS - 1, player);
    const actualGameIdBeforeLimit = player.game.gameId;
    await elapse(1, player);
    const actual = {
        gameId: actualGameId,
        gameIdBeforeLimit: actualGameIdBeforeLimit,
        timeoutGame: { gameId: player.game.gameId, timeout: player.game.timeout },
    };

    // Assert
    expect(actual).toEqual(expected);
});

test("TL-EC17 a new game carries the whole time limit as the remaining time", async () => {
    // Arrange
    fakeCountdownTimers();
    const expected = { first: DEFAULT_TIME_LIMIT_MS, afterTimeout: DEFAULT_TIME_LIMIT_MS };

    // Act
    const player = await connectPlayer();
    const first = player.game.remainingMs;
    await elapse(DEFAULT_TIME_LIMIT_MS, player);
    const actual = { first: first, afterTimeout: player.game.remainingMs };

    // Assert
    expect(actual).toEqual(expected);
});

test("TL-EC18 a player who connects in the middle of a game receives only the time that is left", async () => {
    // Arrange
    fakeCountdownTimers();
    const firstPlayer = await connectPlayer();
    const expected = { remainingMs: DEFAULT_TIME_LIMIT_MS - 20000 };

    // Act
    await elapse(20000, firstPlayer);
    const connectingPlayer = await connectPlayer();
    const actual = { remainingMs: connectingPlayer.game.remainingMs };

    // Assert
    expect(actual).toEqual(expected);
});

test("TL-EC13 a player who connects after a timeout receives the running game without the timeout field", async () => {
    // Arrange
    fakeCountdownTimers();
    const firstPlayer = await connectPlayer();
    await elapse(DEFAULT_TIME_LIMIT_MS, firstPlayer);
    const gameWithoutTimeout = { ...firstPlayer.game };
    delete gameWithoutTimeout.timeout;
    const expected = { firstPlayerGotTimeout: true, game: gameWithoutTimeout };

    // Act
    const connectingPlayer = await connectPlayer();
    const actual = { firstPlayerGotTimeout: firstPlayer.game.timeout, game: connectingPlayer.game };

    // Assert
    expect(actual).toEqual(expected);
});
