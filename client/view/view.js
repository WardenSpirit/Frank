import viewParams from './viewParams.json' with { type: 'json' };
import * as images from './images.js';
import * as heroParser from './parser/heroParser.js';
import * as dustParser from './parser/dustParser.js';
import * as terrainRenderer from './renderer/terrainRenderer.js';
import * as drawingContext from './renderer/drawingContext.js'

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
 * Displays the specified game on the screen.
 * @param renderedGame The game to be rendered.
 */
export async function renderGame(renderedGame) {

    drawingContext.initSquareProportions(renderedGame.map.length, renderedGame.map[0].length);
    await images.isReady();
    terrainRenderer.renderMap(renderedGame.map);
    startRenderingHero(renderedGame.heroPosition);
    startRenderingDust();
    renderTreasure(renderedGame.treasurePosition);

    function startRenderingHero(position) {
        let heroSourceOrigin;
        heroTargetOrigin = drawingContext.calculateTargetOrigin(position);

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
            drawingContext.objectContext.clearRect(heroTargetOrigin.x, heroTargetOrigin.y, drawingContext.square.width, drawingContext.square.height);
        }

        function drawHero(heroSourceOrigin) {
            drawingContext.objectContext.drawImage(images.heroImage, heroSourceOrigin.x, heroSourceOrigin.y, viewParams.sourceTileSize, viewParams.sourceTileSize, heroTargetOrigin.x, heroTargetOrigin.y, drawingContext.square.width, drawingContext.square.height);
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
                    const targetOrigin = drawingContext.calculateTargetOrigin(dust.position);
                    drawingContext.objectContext.clearRect(targetOrigin.x, targetOrigin.y, drawingContext.square.width, drawingContext.square.height);
                }

                function drawDust(i) {
                    const dust = dusts[i];
                    const sourceOrigin = dustParser.calculateDustSourceOrigin(dust);
                    if (!sourceOrigin) {
                        dusts.splice(i, 1);
                        return;
                    }
                    const targetOrigin = drawingContext.calculateTargetOrigin(dust.position);
                    drawingContext.objectContext.drawImage(images.dustImage, sourceOrigin.x, sourceOrigin.y, viewParams.sourceTileSize, viewParams.sourceTileSize, targetOrigin.x, targetOrigin.y, drawingContext.square.width, drawingContext.square.height);
                }
            }
        });
    }

    function renderTreasure(position) {
        const targetOrigin = drawingContext.calculateTargetOrigin(position);
        drawingContext.gameContext.drawImage(images.treasureImage, 0, 0, viewParams.sourceTileSize, viewParams.sourceTileSize, targetOrigin.x, targetOrigin.y, drawingContext.square.width, drawingContext.square.height);
    }
}

/**
 * Displays the move specified by old and new coordinations pairs on the screen.
 * @param oldHeroPosition The position which the hero moves from.
 * @param newHeroPosition The position which the hero moves to.
 */
export function displayMove(oldHeroPosition, newHeroPosition) {
    dusts[dusts.length] = { position: oldHeroPosition, spawnTime: calculateSpawnTime(), phase: "-1" };
    heroTargetOrigin = drawingContext.calculateTargetOrigin(newHeroPosition);
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
 * Tells whether the two arguments represent the same position in the game.
 * @param firstPosition The first position to compare with the other one.
 * @param secondPosition The other position to compare with the first one.
 * @returns True if the x and y coordinations of both specified positions are equal.
 */
function arePositionsSame(firstPosition, secondPosition) {
    return firstPosition.x == secondPosition.x && firstPosition.y == secondPosition.y;
}