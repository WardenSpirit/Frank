const app = require('./app-framework');
const server = require('http').createServer(app);
const WebSocket = require('ws');
const webSocket = require('./websocket');


server.listen(process.env.PORT || 3000, () =>
    console.log('Available on http://localhost:' + (process.env.PORT || 3000)));

const websocketServer = new WebSocket.Server({ server: server });

websocketServer.on("connection", websocket => webSocket.onConnect(websocket));