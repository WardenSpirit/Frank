import * as utils from './utils.js';
import * as animations from './animations.js';

const gameCanvas = document.querySelector("#game");
const ctx = gameCanvas.getContext("2d");
let squareSize = { width: 0, height: 0 };
let game;

const grassImage = new Image();
const holeImage = new Image();
const heroImage = new Image();
const treasureImage = new Image();

grassImage.src = "./assets/Sprout_Lands/Grass.png";
holeImage.src = "./assets/Hole.png";
heroImage.src = "./assets/Figure.png";
treasureImage.src = "./assets/Treasure.png";

const tileSize = 16;
const grassLine = 0;
const grassCount = 8;
const grassMaskForWaterLine = 1;
const grassMaskForWaterCount = 2;
const waterLine = 2;
const waterCount = 4;



export function renderGame(renderedGame) {
    squareSize.width = gameCanvas.offsetWidth / renderedGame.map.length;
    squareSize.height = gameCanvas.offsetHeight / renderedGame.map[0].length;

    renderMap(renderedGame.map);
    renderSquare(heroImage, renderedGame.heroPosition);
    renderSquare(treasureImage, renderedGame.treasurePosition);

    game = renderedGame;
}

function renderMap(map) {
    ctx.clearRect(0, 0, gameCanvas.offsetWidth, gameCanvas.offsetHeight)
    for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
            renderTerrain(map[x][y], { x: x, y: y });
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

export function animateMove(oldHeroPosition, newHeroPosition, move) {
    //animate hero's movement
    console.log("animateMove: " +
        utils.positionToString(oldHeroPosition) +
        " " + move + " to " +
        utils.positionToString(newHeroPosition));
    renderSquare(grassImage, oldHeroPosition);
    renderSquare(heroImage, newHeroPosition);
}