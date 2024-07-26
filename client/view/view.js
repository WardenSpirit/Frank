/**
 * Array that holds all the images returned by the promises.
 */
let images = [];
let imagePromises = [makeImagePromise("./assets/Terrain.png"), makeImagePromise("./assets/Hero2.png"), makeImagePromise("./assets/Dust.png"), makeImagePromise("./assets/Treasure.png")];

/**
 * Makes and returns a promise for loading the picture with the specified path.
 * @param imageSource Path of the picture which should be loaded.
 * @returns Promise of the picture.
 */
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

/**
 * Constant that represents holes on the game map. Numbers are used to shorten strings sent between the server and clients.
 */
const GRASS_CODE = 0;

/**
 * Size (both vertical and horizontal sizes are the same) of the square in the used pictures.
 */
const sourceSquareSize = 16;

/**
 * Parameters which are used when calculating the correct part of picture source. That part is then drew on the canvases.
 */
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

/**
 * Sizes of one square on the canvases.
 */
let squareSize = {};

/**
 * Parameters, which are used for drawing the hero.
 */
const heroAnimationInterval = 300;
const dustAnimationInterval = 150;
let heroState = "STANDING";
let lastHeroUpdateTime = 0;
let lastHeroSourceOriginChangeTime = 0;
let heroSourceOrigin;
let heroTargetOrigin;
let lastHeroTargetOrigin;

/**
 * Coordinations of animation "dusts", that use to be displayed behind the hero after he/she moves.
 */
let dusts = [];

/**
 * Canvases and context configuration settings.
 */
const gameCanvas = document.querySelector("#game");
const heroCanvas = document.querySelector("#hero");
const gameContext = gameCanvas.getContext("2d");
const objectContext = heroCanvas.getContext("2d");
gameContext.imageSmoothingEnabled = false;
objectContext.imageSmoothingEnabled = false;

/**
 * Displays the specified game on the screen.
 * @param renderedGame The game to be rendered.
 */
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

/**
 * Displays the move specified by old and new coordinations pairs on the screen.
 * @param oldHeroPosition The position which the hero moves from.
 * @param newHeroPosition The position which the hero moves to.
 */
export function displayMove(oldHeroPosition, newHeroPosition) {
    dusts[dusts.length] = { position: oldHeroPosition, spawnTime: calculateSpawnTime() };
    heroTargetOrigin = calculateTargetOriginFromPosition(newHeroPosition);
    removeStompedDusts(newHeroPosition);

    function calculateSpawnTime() {
        const currentTime = Date.now();
        if (dusts.length == 0) {
            return currentTime;
        } else {
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

/**
 * Calculates and returns the position on the canvas, where an image should be drew
 * (the coordinations of the top-left corner of the image).
 * @param position The game position of the drew image, in other words, the position on the map.
 * @returns The coordinations of the top-left corner of the image
 */
function calculateTargetOriginFromPosition(position) {
    return { x: position.x * squareSize.width, y: position.y * squareSize.height };
}

/**
 * Tells whether the two arguments represent the same position in the game.
 * @param firstPosition The first position to compare with the other one.
 * @param secondPosition The other position to compare with the first one.
 * @returns True if the x and y coordinations of both specified positions are equal.
 */
function arePositionsSame(firstPosition, secondPosition) {
    return firstPosition.x == secondPosition.x && firstPosition.y == secondPosition.y;
}