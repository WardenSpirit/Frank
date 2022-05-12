const gameCanvas = document.querySelector("#game");
const ctx = gameCanvas.getContext("2d");
let squareSize = { width: 0, height: 0 };

const grassImage = new Image();
const holeImage = new Image();
const heroImage = new Image();
const treasureImage = new Image();

grassImage.src = "./assets/Grass.png";
holeImage.src = "./assets/Hole.png";
heroImage.src = "./assets/Figure.png";
treasureImage.src = "./assets/Treasure.png";

export function renderGame(game) {
    squareSize.width = gameCanvas.offsetWidth / game.map.length;
    squareSize.height = gameCanvas.offsetHeight / game.map[0].length;

    renderMap(game.map);
    renderSquare(heroImage, game.heroPosition);
    renderSquare(treasureImage, game.heroPosition);
}

function renderMap(map) {
    ctx.clearRect(0, 0, gameCanvas.offsetWidth, gameCanvas.offsetHeight)
    for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
            let position = { x: x, y: y };
            renderTerrain(map[x][y], position);
        }
    }
}

function renderTerrain(terrainCode, position) {
    const terrainImage = (terrainCode === 0) ?
        grassImage : holeImage;
        renderSquare(terrainImage, position)
}

function renderSquare(image, position) {
    const origin = { x: position.x * squareSize.width, y: position.y * squareSize.height };
    ctx.drawImage(image, origin.x, origin.y, squareSize.width, squareSize.height);
}

export function animateMoves(moves) {
    //animate hero's movement
}