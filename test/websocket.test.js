import { test, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import GameClient from './support/gameClient.js';
import pathToGameEnd from './support/pathToGameEnd.js';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { onConnect } = require('../server/websocket');
const { CLOSE, DIRECTION, MESSAGE_TYPE } = require('../shared/protocol.json');

const CLOSE_CODE_INVALID_DATA = 1007;

let server;
let players = [];

beforeAll(async () => {
    server = new WebSocketServer({ port: 0 });
    server.on('connection', webSocket => onConnect(webSocket));
    await new Promise(resolve => server.once('listening', resolve));
});

// The server keeps the players and the turn in module state, so every test starts once all its players are gone.
afterEach(async () => {
    players.forEach(player => player.close());
    players = [];
    await vi.waitFor(() => expect(server.clients.size).toBe(0));
});

afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
});

async function connectPlayer() {
    const player = await GameClient.connect(server.address().port);
    players.push(player);
    return player;
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

test('EC23 EC27 BV11 a move of the only player for the current game ends the turn', async () => {
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
    { id: 'EC2', name: 'a raw direction string', data: () => 'UP' },
    { id: 'EC2', name: 'truncated JSON', data: () => '{"type":"MOVE"' },
    { id: 'EC6', name: 'a missing type', data: gameId => JSON.stringify({ clearData: { direction: DIRECTION.UP, gameId: gameId } }) },
    { id: 'EC8', name: 'an unknown type', data: gameId => JSON.stringify({ type: 'JUMP', clearData: { direction: DIRECTION.UP, gameId: gameId } }) },
    { id: 'EC12', name: 'a move with the direction as clearData', data: () => JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: DIRECTION.UP }) },
    { id: 'EC15', name: 'a move in an unknown direction', data: gameId => JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: { direction: 'NORTH', gameId: gameId } }) },
    { id: 'EC25', name: 'a move without a gameId', data: () => JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: { direction: DIRECTION.UP } }) },
    { id: 'EC31', name: 'a valid move in a binary frame', data: gameId => Buffer.from(JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: { direction: DIRECTION.UP, gameId: gameId } })) }
])('$id the server rejects $name and closes the connection', async testCase => {
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

test('EC2 EC23 a rejected player doesn\'t block the turn of the others', async () => {
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

test('EC2 EC23 a rejected player that doesn\'t answer the close frame doesn\'t block the turn of the others', async () => {
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

test('EC32 the server closes the connection of a player that sends a text frame that isn\'t valid UTF-8', async () => {
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

test('EC23 EC32 a player that sends an invalid frame and doesn\'t answer the close frame doesn\'t block the turn of the others', async () => {
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

test('EC2 the server doesn\'t record a move sent after a rejected message', async () => {
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

test('BV8 BV9 the turn waits until every player has moved', async () => {
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

test('EC21 the server ignores a second move of a player in the same turn', async () => {
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

test('EC28 BV10 a move for the previous game has no effect on the new game', async () => {
    // Arrange
    const firstPlayer = await connectPlayer();
    const previousGame = firstPlayer.game;
    const lastDirection = await walkToLastStep(firstPlayer);
    const secondPlayer = await connectPlayer();
    const expected = {
        turnEndedBeforeSecondMove: false,
        endingTurn: [lastDirection, DIRECTION.RIGHT],
        newGameId: previousGame.gameId + 1,
        newGameTurn: [DIRECTION.LEFT, DIRECTION.DOWN]
    };

    // Act
    const endingTurn = firstPlayer.nextMessage(MESSAGE_TYPE.MOVES);
    const newGame = firstPlayer.nextMessage(MESSAGE_TYPE.GAME);
    let turnEndedBeforeSecondMove = false;
    secondPlayer.nextMessage(MESSAGE_TYPE.MOVES).then(() => { turnEndedBeforeSecondMove = true; });
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
        newGameTurn: await newGameTurn
    };

    // Assert
    expect(actual).toEqual(expected);
});

test('EC28 BV10 a move for the previous game has no effect after a disconnect ends the game', async () => {
    // Arrange
    const movingPlayer = await connectPlayer();
    const previousGame = movingPlayer.game;
    const lastDirection = await walkToLastStep(movingPlayer);
    const leavingPlayer = await connectPlayer();
    const expected = {
        endingTurn: [lastDirection],
        newGameId: previousGame.gameId + 1,
        newGameTurn: [DIRECTION.LEFT]
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
        newGameTurn: await newGameTurn
    };

    // Assert
    expect(actual).toEqual(expected);
});

test('EC29 BV12 the server ignores a move for a game that has not started yet', async () => {
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
