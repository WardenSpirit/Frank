const WebSocket = require("ws");
const GameState = require("./gameState.js");

const webSocketServer = new WebSocket.Server({ port: 8186 });

let game = null;

let webSockets = []
let moves = [];

webSocketServer.on("connection", webSocket => {

    webSockets[webSockets.length] = webSocket;

    if (webSockets.length == 1) {
        startANewGame();
    }

    webSocket.addEventListener("message", ({ data }) => {
        if (!hasAlreadySentMove(webSocket) &&
            data === "UP" || data === "RIGHT" || data === "DOWN" || data === "LEFT") {
            fillInMove(data);
        }
    });

    webSocket.addEventListener("close", () => {
        eliminateWebSocket(webSocket);
    });
});
//maybe the disconnection can be handled here as well, next to handling connection

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
    sendMovesToAll();
    performMoves();
    if (heroOutOfPath()) {
        startANewGame();
    }
}

function performMoves() {
    for (let i = 0; i < moves.length; i++) {
        performMove(moves[i]);
        if (!heroOutOfPath()) {
            break;
        }
    }
}

function performMove(direction) {

    let potentialNewHeroPosition;
    switch (direction) {
        case "UP":
            potentialNewHeroPosition = { x: game.heroPosition.x, y: game.heroPosition.y - 1 };
            break;
        case "RIGHT":
            potentialNewHeroPosition = { x: game.heroPosition.x + 1, y: game.heroPosition.y };
            break;
        case "DOWN":
            potentialNewHeroPosition = { x: game.heroPosition.x, y: game.heroPosition.y + 1 };
            break;
        case "LEFT":
            potentialNewHeroPosition = { x: game.heroPosition.x - 1, y: game.heroPosition.y };
            break;
    }

    if (isPositionWithinMapBounds(potentialNewHeroPosition)) {
        game.heroPosition = potentialNewHeroPosition;
    }
}

function isPositionWithinMapBounds(inspectedPosition) {
    return inspectedPosition.x >= 0 && inspectedPosition < game.map.length &&
        inspectedPosition.x >= 0 && inspectedPosition < game.map[0].length;
}

function heroOutOfPath() {
    return didHeroFindTreasure() || didHeroStepInHole();
}

function didHeroFindTreasure() {
    return game.heroPosition.x == game.treasurePosition.x && game.heroPosition.y == game.treasurePosition.y;
}

function didHeroStepInHole() {
    return game.map[game.heroPosition.x][game.heroPosition.y] == Game.HOLE;
}

function startANewGame() {
    game = new GameState();
    sendToAll(game);
}

function sendToAll(message) {
    for (let i = 0; i < webSockets.length; i++) {
        webSockets[i].send(message);
    }
}