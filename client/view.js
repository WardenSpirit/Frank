import * as utils from './utils.js';

let images = [];
let imagePromises = [makeImagePromise("./assets/Terrain.png"), makeImagePromise("./assets/Hero2.png"), makeImagePromise("./assets/Treasure.png")];
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
const GRASS_CODE = 0;

const sourceSquareSize = 16;
const grassLine = 0;
const maskForWaterLine = 1;
const waterLine = 2;
const standingHeroLine = 0;
const walkUpHeroLine = 1;
const walkRightHeroLine = 2;
const walkDownHeroLine = 3;
const walkLeftHeroLine = 4;

const grassCount = 8;
const maskForWaterCount = 4;
const waterCount = 4;
const heroCount = 4;

let squareSize = {};

const ANIMATION_INTERVAL = 300;
let heroState = "STANDING";
let lastUpdateTime = 0;
let lastSourceOriginChangeTime = lastUpdateTime;
let heroSourceOrigin;
let heroTargetOrigin;
let lastHeroTargetOrigin;

let dustPositions = [];

const gameCanvas = document.querySelector("#game");
const heroCanvas = document.querySelector("#hero");
const gameContext = gameCanvas.getContext("2d");
const heroContext = heroCanvas.getContext("2d");
gameContext.imageSmoothingEnabled = false;
heroContext.imageSmoothingEnabled = false;


export async function renderGame(renderedGame) {

    squareSize.width = gameCanvas.width / renderedGame.map.length;
    squareSize.height = gameCanvas.height / renderedGame.map[0].length;

    await Promise.allSettled(imagePromises);
    renderMap(renderedGame.map);
    startRenderingHero(renderedGame.heroPosition);
    //startRenderingDust();
    renderTreasure(renderedGame.treasurePosition);

    function renderMap(map) {
        gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
        for (let x = 0; x < map.length; x++) {
            for (let y = 0; y < map[x].length; y++) {
                renderTerrain(map[x][y], { x: x, y: y });
            }
        }

        function renderTerrain(terrainCode, position) {
            if (terrainCode === GRASS_CODE) {
                renderGrass(position);
            } else {
                renderWater(position);
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
                gameContext.drawImage(terrainImage, sourceOrigin.x, sourceOrigin.y, sourceSquareSize, sourceSquareSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
            }
        }
    }

    function startRenderingHero(position) {
    
        heroSourceOrigin = { x: 0, y: standingHeroLine };
        heroTargetOrigin = calculateTargetOriginFromPosition(position);
    
        requestAnimationFrame(function animate(documentAge) {
            updateHeroAnimationOrigins(documentAge);
            if (lastHeroTargetOrigin != undefined) {
                clearHero();
            }
            drawHero();
            requestAnimationFrame(animate);
        });
    
        function updateHeroAnimationOrigins(currentTime) {
            const deltaTime = currentTime - lastUpdateTime;
            lastUpdateTime = currentTime;
    
            heroSourceOrigin = calculateHeroSourceOrigin(currentTime);
            heroTargetOrigin = calculateHeroTargetOrigin(deltaTime);
    
            function calculateHeroSourceOrigin(currentTime) {
                if (currentTime - lastSourceOriginChangeTime > ANIMATION_INTERVAL) {
                    lastSourceOriginChangeTime = currentTime - currentTime % ANIMATION_INTERVAL;
                    const x = (heroSourceOrigin.x + sourceSquareSize) % (heroCount * sourceSquareSize);
                    let y;
                    switch (heroState) {
                        case "UP":
                            y = walkUpHeroLine;
                            break;
                        case "RIGHT":
                            y = walkRightHeroLine;
                            break;
                        case "DOWN":
                            y = walkDownHeroLine;
                            break;
                        case "LEFT":
                            y = walkLeftHeroLine;
                            break;
                        default:        //case "STANDING":
                            y = standingHeroLine;
                            break;
                    }
                    return { x: x, y: y };
                }
                return heroSourceOrigin;
            }
    
            function calculateHeroTargetOrigin(deltaTime) {
                let speed = getHeroSpeed();
                return {
                    x: heroTargetOrigin.x + speed.x * deltaTime,
                    y: heroTargetOrigin.y + speed.y * deltaTime
                };
    
    
                function getHeroSpeed() {
                    switch (heroState) {
                        case ("UP"):
                            return { x: 0, y: -0.1 };
                        case ("RIGHT"):
                            return { x: 0.1, y: 0 };
                        case ("DOWN"):
                            return { x: 0, y: 0.1 };
                        case ("LEFT"):
                            return { x: -0.1, y: 0 };
                        default:        //case ("STANDING")
                            return { x: 0, y: 0 };
                    }
                }
            }
        }
    
        function clearHero() {
            heroContext.clearRect(lastHeroTargetOrigin.x, lastHeroTargetOrigin.y, squareSize.width, squareSize.height);
        }
    
        function drawHero() {
            heroContext.drawImage(heroImage, heroSourceOrigin.x, heroSourceOrigin.y, sourceSquareSize, sourceSquareSize, heroTargetOrigin.x, heroTargetOrigin.y, squareSize.width, squareSize.height);
            lastHeroTargetOrigin = heroTargetOrigin;
        }
    }

    function renderTreasure(position) {
        const targetOrigin = calculateTargetOriginFromPosition(position);
        gameContext.drawImage(treasureImage, 0, 0, sourceSquareSize, sourceSquareSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
    }
}

export function displayMove(oldHeroPosition, newHeroPosition, move) {

    heroTargetOrigin = calculateTargetOriginFromPosition(newHeroPosition);
    dustPositions[dustPositions.length] = oldHeroPosition;
}

function calculateTargetOriginFromPosition(position) {
    return { x: position.x * squareSize.width, y: position.y * squareSize.height };
}