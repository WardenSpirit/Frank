import * as utils from './utils.js';

let images = [];
let imagePromises = [makeImagePromise("./assets/Terrain.png"), makeImagePromise("./assets/Hero2.png"), makeImagePromise("./assets/Dust.png"), makeImagePromise("./assets/Treasure.png")];
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
const dustImage = images[2];
const treasureImage = images[3];
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
const dustLine = 0;

const grassCount = 8;
const maskForWaterCount = 4;
const waterCount = 4;
const heroCount = 4;
const dustCount = 4;

let squareSize = {};

const heroAnimationInterval = 300;
const dustAnimationInterval = 150;
let heroState = "STANDING";
let lastHeroUpdateTime = 0;
let lastHeroSourceOriginChangeTime = 0;
let heroSourceOrigin;
let heroTargetOrigin;
let lastHeroTargetOrigin;

let dusts = [];

const gameCanvas = document.querySelector("#game");
const heroCanvas = document.querySelector("#hero");
const gameContext = gameCanvas.getContext("2d");
const objectContext = heroCanvas.getContext("2d");
gameContext.imageSmoothingEnabled = false;
objectContext.imageSmoothingEnabled = false;


export async function renderGame(renderedGame) {

    squareSize.width = gameCanvas.width / renderedGame.map.length;
    squareSize.height = gameCanvas.height / renderedGame.map[0].length;

    await Promise.allSettled(imagePromises);
    renderMap(renderedGame.map);
    startRenderingHero(renderedGame.heroPosition);
    startRenderingDust();
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

        requestAnimationFrame(function animateHero(documentAge) {
            updateHeroAnimationOrigins(documentAge);
            if (lastHeroTargetOrigin != undefined) {
                clearHero();
            }
            drawHero();
            requestAnimationFrame(animateHero);
        });

        function updateHeroAnimationOrigins(currentTime) {
            const deltaTime = currentTime - lastHeroUpdateTime;
            lastHeroUpdateTime = currentTime;

            heroSourceOrigin = calculateHeroSourceOrigin(currentTime);
            heroTargetOrigin = calculateHeroTargetOrigin(deltaTime);

            function calculateHeroSourceOrigin(currentTime) {
                if (currentTime - lastHeroSourceOriginChangeTime > heroAnimationInterval) {
                    lastHeroSourceOriginChangeTime = currentTime - currentTime % heroAnimationInterval;
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
            objectContext.clearRect(lastHeroTargetOrigin.x, lastHeroTargetOrigin.y, squareSize.width, squareSize.height);
        }

        function drawHero() {
            objectContext.drawImage(heroImage, heroSourceOrigin.x, heroSourceOrigin.y, sourceSquareSize, sourceSquareSize, heroTargetOrigin.x, heroTargetOrigin.y, squareSize.width, squareSize.height);
            lastHeroTargetOrigin = heroTargetOrigin;
        }
    }

    function startRenderingDust() {
        requestAnimationFrame(function animateDust() {
            updateDusts(Date.now());
            requestAnimationFrame(animateDust);

            function updateDusts(currentTime) {
                for (let i = 0; i < dusts.length; i++) {
                    const dust = dusts[i];

                    const oldPhase = dust.phase;
                    dust.phase = Math.floor((currentTime - dust.spawnTime) / dustAnimationInterval);

                    if (oldPhase != dust.phase) {
                        clearDust(dust);
                        if (dust.phase >= dustCount) {
                            dusts.splice(i, 1);
                        } else {
                            drawDust(dust)
                        }
                    }
                }

                function clearDust(dust) {
                    const targetOrigin = calculateTargetOriginFromPosition(dust.position);
                    objectContext.clearRect(targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
                }

                function drawDust(dust) {
                    const sourceOrigin = {
                        x: dust.phase * sourceSquareSize,
                        y: dustLine * sourceSquareSize
                    };
                    const targetOrigin = calculateTargetOriginFromPosition(dust.position);
                    objectContext.drawImage(dustImage, sourceOrigin.x, sourceOrigin.y, sourceSquareSize, sourceSquareSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
                }
            }
        });
    }

    function renderTreasure(position) {
        const targetOrigin = calculateTargetOriginFromPosition(position);
        gameContext.drawImage(treasureImage, 0, 0, sourceSquareSize, sourceSquareSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
    }
}

export function displayMove(oldHeroPosition, newHeroPosition) {
    console.log("dusts.length: " + dusts.length);
    dusts[dusts.length] = { position: oldHeroPosition, spawnTime: calculateSpawnTime() };
    heroTargetOrigin = calculateTargetOriginFromPosition(newHeroPosition);
    removeStompedDusts(newHeroPosition);

    function calculateSpawnTime() {
        const currentTime = Date.now();
        if (dusts.length == 0) {
            return currentTime;
        } else {
            console.log(`max(${dusts[dusts.length - 1].spawnTime + dustAnimationInterval / dusts.length}, ${currentTime}): ` +
            Math.max(dusts[dusts.length - 1].spawnTime + dustAnimationInterval / dusts.length, currentTime));
            return Math.max(dusts[dusts.length - 1].spawnTime + dustAnimationInterval / dusts.length, currentTime);
        }
    }

    function removeStompedDusts(stompedPosition) {
        for (let i = dusts.length - 1; i >= 0; i--) {
            const dust = dusts[i];
            if (arePositionsSame(dust.position, stompedPosition)) {
                dusts.splice(i, 1);
            }
        }
    }
}

function calculateTargetOriginFromPosition(position) {
    return { x: position.x * squareSize.width, y: position.y * squareSize.height };
}

function arePositionsSame(firstPosition, secondPosition) {
    return firstPosition.x == secondPosition.x && firstPosition.y == secondPosition.y;
}