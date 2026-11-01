const app = require('./app-framework');
const server = require('http').createServer(app);
const WebSocket = require('ws');
const webSocket = require('./websocket');
const { getListenHost } = require('./listenHost');

const PORT = process.env.PORT || 3000
const HOST = getListenHost(process.env);

server.listen(PORT, HOST, () => console.log(`${new Date()}... The server is listening on ${HOST}:${PORT}`));

const websocketServer = new WebSocket.Server({ server: server });

websocketServer.on("connection", websocket => webSocket.onConnect(websocket));