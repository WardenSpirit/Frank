import * as utils from './utils.js';

let images = [];
let imagePromises = [makeImagePromise("./assets/Terrain.png"), makeImagePromise("./assets/Hero.png"), makeImagePromise("./assets/Treasure.png")];
function makeImagePromise(imageSource) {
    return new Promise(function (resolve, reject) {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageSource;
        images[images.length] = image;
    });
}
const terrainImage = images[0];
const heroImage = images[1];
const treasureImage = images[2];

const sourceSquareSize = 16;        //drawImage() will always use the source element's intrinsic size in CSS pixels when drawing, cropping, and/or scaling.
const grassLine = 0;
const maskForWaterLine = 1;
const waterLine = 2;
const grassCount = 8;
const maskForWaterCount = 4;
const waterCount = 4;

const standingHeroLine = 0;
const walkUpHeroLine = 1;
const walkRightHeroLine = 2;
const walkDownHeroLine = 3;
const walkLeftHeroLine = 4;

const gameCanvas = document.querySelector("#game");
const ctx = gameCanvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let squareSize = {};
const grassCode = 0;


export async function renderGame(renderedGame) {

    squareSize.width = gameCanvas.width / renderedGame.map.length;
    squareSize.height = gameCanvas.height / renderedGame.map[0].length;

    await Promise.allSettled(imagePromises);
    renderMap(renderedGame.map);
    renderHero(getHeroSourceOriginByState("STANDING"), renderedGame.heroPosition);
    renderTreasure(renderedGame.treasurePosition);
}

function renderMap(map) {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
    for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
            renderTerrain(map[x][y], { x: x, y: y });
        }
    }
}

function renderTerrain(terrainCode, position) {
    if (terrainCode === grassCode) {
        renderGrass(position);
    } else {
        renderWater(position);
    }
}

export function animateMove(oldHeroPosition, newHeroPosition, move) {
    //animate hero's movement
    console.log("animateMove: " +
        utils.positionToString(oldHeroPosition) +
        " " + move + " to " +
        utils.positionToString(newHeroPosition));
    renderGrass(oldHeroPosition);
    renderHero(getHeroSourceOriginByState("STANDING"), newHeroPosition);
}

function renderGrass(position) {
    const sourceOrigin = {
        x: Math.floor(Math.random() * grassCount) * sourceSquareSize,
        y: grassLine * sourceSquareSize
    };
    renderTerrainSquare(sourceOrigin, position);
}

function renderWater(position) {
    renderWaterBase(position);
    renderMaskForWater(position);

    function renderWaterBase(position) {
        const sourceOrigin = {
            x: Math.floor(Math.random() * waterCount) * sourceSquareSize,
            y: waterLine * sourceSquareSize
        };
        renderTerrainSquare(sourceOrigin, position);
    }

    function renderMaskForWater(position) {
        const sourceOrigin = {
            x: Math.floor(Math.random() * maskForWaterCount) * sourceSquareSize,
            y: maskForWaterLine * sourceSquareSize
        };
        renderTerrainSquare(sourceOrigin, position);
    }
}

function renderTerrainSquare(sourceOrigin, position) {
    const targetOrigin = calculateTargetOriginFromPosition(position);
    ctx.drawImage(terrainImage, sourceOrigin.x, sourceOrigin.y, sourceSquareSize, sourceSquareSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
}

function getHeroSourceOriginByState(state) {
    switch (state) {
        case "STANDING":
            return { x: 0, y: 0 };
    }
}

function renderHero(sourceOrigin, position) {
    const targetOrigin = calculateTargetOriginFromPosition(position);
    ctx.drawImage(heroImage, sourceOrigin.x, sourceOrigin.y, sourceSquareSize, sourceSquareSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
}

function renderTreasure(position) {
    const targetOrigin = calculateTargetOriginFromPosition(position);
    ctx.drawImage(treasureImage, 0, 0, sourceSquareSize, sourceSquareSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
}

function calculateTargetOriginFromPosition(position) {
    return { x: position.x * squareSize.width, y: position.y * squareSize.height };
}