import { test, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import GameClient from './support/gameClient.js';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { onConnect } = require('../server/websocket');
const { DIRECTION, MESSAGE_TYPE } = require('../shared/protocol.json');

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

test('EC23 a move of the only player ends the turn', async () => {
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

test.each([
    { id: 'EC2', name: 'a raw direction string', data: 'UP' },
    { id: 'EC2', name: 'truncated JSON', data: '{"type":"MOVE"' },
    { id: 'EC6', name: 'a missing type', data: JSON.stringify({ clearData: { direction: DIRECTION.UP } }) },
    { id: 'EC8', name: 'an unknown type', data: JSON.stringify({ type: 'JUMP', clearData: { direction: DIRECTION.UP } }) },
    { id: 'EC12', name: 'a move with the direction as clearData', data: JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: DIRECTION.UP }) },
    { id: 'EC15', name: 'a move in an unknown direction', data: JSON.stringify({ type: MESSAGE_TYPE.MOVE, clearData: { direction: 'NORTH' } }) }
])('$id the server ignores $name and the turn continues', async testCase => {
    // Arrange
    const player = await connectPlayer();
    const expected = [DIRECTION.LEFT];

    // Act
    const moves = player.nextMessage(MESSAGE_TYPE.MOVES);
    player.sendRaw(testCase.data);
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
