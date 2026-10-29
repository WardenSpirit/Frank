import WebSocket from 'ws';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MESSAGE_TYPE } = require('../../shared/protocol.json');

/**
 * A player connected to the game server, which sends client messages and waits for server messages.
 */
export default class GameClient {
    static async connect(port) {
        const socket = new WebSocket(`ws://localhost:${port}`);
        await new Promise((resolve, reject) => {
            socket.once('open', resolve);
            socket.once('error', reject);
        });
        return new GameClient(socket);
    }

    constructor(socket) {
        this.socket = socket;
    }

    sendMove(direction) {
        this.sendMessage({ type: MESSAGE_TYPE.MOVE, clearData: { direction: direction } });
    }

    sendMessage(message) {
        this.sendRaw(JSON.stringify(message));
    }

    sendRaw(data) {
        this.socket.send(data);
    }

    /**
     * Call before sending the messages that should cause the awaited one.
     * @returns A promise of clearData of the next server message of the given type.
     */
    nextMessage(type) {
        return new Promise(resolve => {
            const onMessage = data => {
                const message = JSON.parse(data);
                if (message.type === type) {
                    this.socket.off('message', onMessage);
                    resolve(message.clearData);
                }
            };
            this.socket.on('message', onMessage);
        });
    }

    close() {
        this.socket.close();
    }
}
