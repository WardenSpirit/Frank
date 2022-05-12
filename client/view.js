const gameCanvas = document.querySelector("#game");
const ctx = gameCanvas.getContext("2d");
let squareSize;

export function renderGame(game) {
    squareSize.Width = gameCanvas.offsetWidth / game.map.length;
    squareSize.Height = gameCanvas.offsetHeight / game.map[0].length;

    renderMap(game.map);
    renderHero(game.heroPosition);
    renderTreasure(game.treasurePosition);
}

function renderMap(map) {
    ctx.clearRect(0, 0, gameCanvas.offsetWidth, gameCanvas.offsetHeight)
    for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
            let origin = { x: x * squareSize.Width, y: y * squareSize.Height };
            renderTerrain(map[x][y], origin);
        }
    }
}

function renderTerrain(terrainCode, origin) {
    const terrainImage = new Image();
    terrainImage.src = (terrainCode === 0) ?
        "./assets/Grass.png" : "./assets/Hole.png";
    ctx.drawImage(terrainImage, origin.x, origin.y, squareSize.Width, squareSize.Height);
}

function renderHero(heroPosition) {
    const heroImage = new Image();
    heroImage.src = "./assets/Figure.png";
    const origin = { x: heroPosition.x * squareSize.Width, y: heroPosition.y * squareSize.Height };
    ctx.drawImage(heroImage, origin.x, origin.y, squareSize.Width, squareSize.Height);
}

export function animateMoves(moves) {
    //animate hero's movement
}