const app = require('./app-framework');
const server = require('http').createServer(app);
const WebSocket = require('ws');
const webSocket = require('./websocket');

const PORT = process.env.PORT || 5000

server.listen(PORT, () => console.log(`${new Date()}... The server is listening on port ${PORT}`));

const websocketServer = new WebSocket.Server({ server: server });

websocketServer.on("connection", websocket => webSocket.onConnect(websocket));