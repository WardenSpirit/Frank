require("./gameLogic.js");
const WebSocket = require("ws");
const { Game } = require("./gameLogic.js");

const webSocketServer = new WebSocket.Server({ port: 8186 });

let map = [];
const PATH = 0;
const HOLE = 1;

let heroPosition = {};
let treasurePosition = {};

let webSockets = []
let moves = [];

webSocketServer.on("connection", webSocket => {
    
    webSockets[webSocckets.length] = webSocket;

    if (webSockets.length == 1) {
        establishNewGame(webSocket);
    }

    webSocket.addEventListener("message", ({ data }) => {
        //react on a client's message
        if (!hasAlreadySentMove(webSocket) &&
            data === "UP" || data === "RIGHT" || data === "DOWN" || data === "LEFT") {
            fillInMove(data);
        }
    });

    webSocket.addEventListener("close", () => {
        //react on closing of connection
        eliminateWebSocket(webSocket);
    });
});
//maybe the disconnection can be handled here as well, next to handling connection

function establishNewGame() {
    
    //generate a map and a hero position and send it
}

function fillInMove(direction) {
    moves[moves.length] = direction;
    if (allMovesSent()) {
        realizeTurn();
    }
}

function eliminateWebSocket(webSocket) {
    webSockets.splice(webSockets.indexOf(webSocket), 1);
    if (allMovesSent) {
        realizeTurn();
    }
}

function allMovesSent() {
    return moves.length == webSockets.length;
}

function realizeTurn() {
    performMoves();
    //if hero meets the treasure
    establishNewGame()
    //else send the new position
    sendResult();
}

function sendResult() {
    if (didHeroFindTreasure()) {
        map = generateNewMap();
        //send a new map and winning info
    } else if (didHeroStepInHole()) {
        map = generateNewMap();
        //send a new map and loosing info
    } else {
        //send the position
    }
}

function performMoves() {
    for (let i = 0; i < moves.length; i++) {
        if (!performMove(moves[i])) {
            break;
        }
    }
    moves = [];
}
function performMove(move) {
    return didHeroFindTreasure() || didHeroStepInHole();
}

function generateNewMap() {

}

function didHeroFindTreasure() {
    return heroPosition.x == treasurePosition.x && heroPosition.y == treasurePosition.y;
}
function didHeroStepInHole() {
    return map[heroPosition.x][heroPosition.y] == HOLE;
}