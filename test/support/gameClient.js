import WebSocket from "ws";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { MESSAGE_TYPE } = require("../../shared/protocol.json");

/**
 * A player connected to the game server, which sends client messages and waits for server messages.
 */
export default class GameClient {
    /**
     * @returns A promise of a client that has received the game the server sent on connecting.
     */
    static async connect(port) {
        const client = new GameClient(new WebSocket(`ws://localhost:${port}`));
        const game = client.nextMessage(MESSAGE_TYPE.GAME);
        await new Promise((resolve, reject) => {
            client.socket.once("open", resolve);
            client.socket.once("error", reject);
        });
        await game;
        return client;
    }

    constructor(socket) {
        this.socket = socket;
        this.game = null;
        this.waiting = [];
        this.receivedTypes = [];
        // The game is updated before the promises of nextMessage resolve.
        this.socket.on("message", data => {
            const message = JSON.parse(data);
            this.receivedTypes.push(message.type);
            if (message.type === MESSAGE_TYPE.GAME) {
                this.game = message.clearData;
            }
            const resolved = this.waiting.filter(waiter => waiter.type === message.type);
            this.waiting = this.waiting.filter(waiter => waiter.type !== message.type);
            resolved.forEach(waiter => waiter.resolve(message.clearData));
        });
    }

    sendMove(direction, gameId = this.game.gameId) {
        this.sendMessage({ type: MESSAGE_TYPE.MOVE, clearData: { direction: direction, gameId: gameId } });
    }

    sendSettings(settings) {
        this.sendMessage({ type: MESSAGE_TYPE.SETTINGS, clearData: settings });
    }

    /**
     * @returns The types of the messages received after the last GAME.
     */
    typesSinceLastGame() {
        return this.receivedTypes.slice(this.receivedTypes.lastIndexOf(MESSAGE_TYPE.GAME) + 1);
    }

    sendMessage(message) {
        this.sendRaw(JSON.stringify(message));
    }

    sendRaw(data) {
        this.socket.send(data);
    }

    /**
     * Sends a text frame that isn't valid UTF-8, which ws on the server rejects before the game sees the message.
     */
    sendInvalidUtf8() {
        this.socket.send(Buffer.from([0xff]), { binary: false });
    }

    /**
     * Call before sending the messages that should cause the awaited one.
     * @returns A promise of clearData of the next server message of the given type.
     */
    nextMessage(type) {
        return new Promise(resolve => this.waiting.push({ type: type, resolve: resolve }));
    }

    /**
     * The server handles the messages of a socket in the order they were sent and answers a ping after them.
     * Its replies to those messages are sent on the same socket, so they arrive before the pong.
     * @returns A promise that resolves once the server has handled every message this client sent before.
     */
    sync() {
        return new Promise(resolve => {
            this.socket.once("pong", () => resolve());
            this.socket.ping();
        });
    }

    /**
     * Call before sending the messages that should cause the server to close the connection.
     * @returns A promise of the close code and the reason the server sent.
     */
    nextClose() {
        return new Promise(resolve =>
            this.socket.once("close", (code, reason) => resolve({ code: code, reason: reason.toString() })),
        );
    }

    /**
     * Stops reading what the server sends, so the client never answers a close frame, like a stalled network.
     * Call in the same tick as sending the message the server answers, so the answer isn't read before.
     */
    stopReading() {
        this.socket._socket.pause();
        this.stalled = true;
    }

    /**
     * A stalled client would never complete the closing handshake, so its connection is dropped instead.
     */
    close() {
        if (this.stalled) {
            this.socket.terminate();
        } else {
            this.socket.close();
        }
    }
}
