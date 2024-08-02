import * as terrainParser from './parser/terrainParser.js';
import * as heroParser from './parser/heroParser.js';
import * as dustParser from './parser/dustParser.js';
import viewParams from './viewParams.json' with { type: 'json' };
import * as images from './images.js';

/**
 * Sizes of one square on the canvases.
 */
let squareSize = {};

/**
 * Parameters, which are used for drawing the hero.
 */
let heroTargetOrigin;
const dustAnimationInterval = 150;
let heroState = "STANDING";
let lastHeroUpdateTime = 0;

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

    await images.isReady();
    renderMap(renderedGame.map);
    startRenderingHero(renderedGame.heroPosition);
    startRenderingDust();
    renderTreasure(renderedGame.treasurePosition);

    function renderMap(map) {
        gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
        for (let x = 0; x < map.length; x++) {
            for (let y = 0; y < map[x].length; y++) {
                renderTerrain(map, { x: x, y: y });
            }
        }

        function renderTerrain(map, position) {
            const sourceOrigin = terrainParser.getTerrainSource(map, position);
            const targetOrigin = calculateTargetOriginFromPosition(position);
            gameContext.drawImage(images.terrainImage, sourceOrigin.x, sourceOrigin.y, viewParams.sourceTileSize, viewParams.sourceTileSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
        }
    }

    function startRenderingHero(position) {
        let heroSourceOrigin;
        heroTargetOrigin = calculateTargetOriginFromPosition(position);

        requestAnimationFrame(function animateHero(currentTime) {
            clearHero();
            heroSourceOrigin = heroParser.calculateHeroSourceOrigin(heroState, currentTime);
            heroTargetOrigin = updateHeroTargetOrigin(currentTime);
            drawHero(heroSourceOrigin);
            requestAnimationFrame(animateHero);
        });

        function updateHeroTargetOrigin(currentTime) {
            const deltaTime = currentTime - lastHeroUpdateTime;
            lastHeroUpdateTime = currentTime;
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

        function clearHero() {
            objectContext.clearRect(heroTargetOrigin.x, heroTargetOrigin.y, squareSize.width, squareSize.height);
        }

        function drawHero(heroSourceOrigin) {
            objectContext.drawImage(images.heroImage, heroSourceOrigin.x, heroSourceOrigin.y, viewParams.sourceTileSize, viewParams.sourceTileSize, heroTargetOrigin.x, heroTargetOrigin.y, squareSize.width, squareSize.height);
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
                        drawDust(i);
                    }
                }

                function clearDust(dust) {
                    const targetOrigin = calculateTargetOriginFromPosition(dust.position);
                    objectContext.clearRect(targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
                }

                function drawDust(i) {
                    const dust = dusts[i];
                    const sourceOrigin = dustParser.calculateDustSourceOrigin(dust);
                    if (!sourceOrigin) {
                        dusts.splice(i, 1);
                        return;
                    }
                    const targetOrigin = calculateTargetOriginFromPosition(dust.position);
                    objectContext.drawImage(images.dustImage, sourceOrigin.x, sourceOrigin.y, viewParams.sourceTileSize, viewParams.sourceTileSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
                }
            }
        });
    }

    function renderTreasure(position) {
        const targetOrigin = calculateTargetOriginFromPosition(position);
        gameContext.drawImage(images.treasureImage, 0, 0, viewParams.sourceTileSize, viewParams.sourceTileSize, targetOrigin.x, targetOrigin.y, squareSize.width, squareSize.height);
    }
}

/**
 * Displays the move specified by old and new coordinations pairs on the screen.
 * @param oldHeroPosition The position which the hero moves from.
 * @param newHeroPosition The position which the hero moves to.
 */
export function displayMove(oldHeroPosition, newHeroPosition) {
    dusts[dusts.length] = { position: oldHeroPosition, spawnTime: calculateSpawnTime(), phase: "-1" };
    heroTargetOrigin = calculateTargetOriginFromPosition(newHeroPosition);
    removeStompedDust(newHeroPosition);

    function calculateSpawnTime() {
        const currentTime = Date.now();
        if (dusts.length == 0) {
            return currentTime;
        } else {
            return Math.max(dusts[dusts.length - 1].spawnTime + dustAnimationInterval / dusts.length, currentTime);
        }
    }

    function removeStompedDust(stompedPosition) {
        for (let i = dusts.length - 1; i >= 0; i--) {
            const dust = dusts[i];
            if (arePositionsSame(dust.position, stompedPosition)) {
                dusts.splice(i, 1);
                break;
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