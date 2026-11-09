const getRandomIndex = require("./array").getRandomIndex;
const Game = require("./game");
const { TERRAIN } = require("../shared/protocol.json");
const { getRandomElement } = require("./array");

class GameFactory {
    constructor(random = Math.random) {
        this.random = random;
        this.lastGameId = 0;
    }

    /**
     * @param settings The settings of the new game; the map uses mapSize and holeRatio.
     */
    createGame(settings) {
        //generating function must be called in this order
        this.map = this.generateMap(settings.mapSize, settings.holeRatio);
        let positionsOnTheSameLand = this.generateTwoSameLandPositions();
        this.heroPosition = positionsOnTheSameLand[0];
        this.treasurePosition = positionsOnTheSameLand[1];

        return new Game(this.map, this.treasurePosition, this.heroPosition, ++this.lastGameId, settings);
    }

    /**
     * @param mapSize The side length of the square map in tiles.
     * @param holeRatio The percentage of tiles that are holes.
     */
    generateMap(mapSize, holeRatio) {
        let map = [];
        const terrainGenerator = this.terrainGenerator(mapSize, holeRatio);

        for (let x = 0; x < mapSize; x++) {
            map[x] = [];
            for (let y = 0; y < mapSize; y++) {
                map[x][y] = terrainGenerator.next().value;
            }
        }

        return map;
    }

    /**
     * Makes mapSize² · holeRatio / 100 holes rounded down or up. A square is a hole with the probability of the holes
     * left to make among the squares left, so when no hole is left to make, even the random value 0 makes a path.
     */
    *terrainGenerator(mapSize, holeRatio) {
        let squaresToMake = mapSize * mapSize;
        // Dividing last keeps a whole number of holes exact.
        let holesToMake = (squaresToMake * holeRatio) / 100;

        while (squaresToMake > 0) {
            if (this.random() * squaresToMake >= holesToMake) {
                yield TERRAIN.PATH;
            } else {
                yield TERRAIN.HOLE;
                holesToMake--;
            }
            squaresToMake--;
        }
    }

    generateTwoSameLandPositions() {
        let origin;
        let positionsOnTheSameLand;

        do {
            origin = {
                x: getRandomIndex(this.map, this.random),
                y: getRandomIndex(this.map[0], this.random),
            };
            positionsOnTheSameLand = this.findSameLand(origin);
        } while (positionsOnTheSameLand.length == 0);

        let otherPosition = getRandomElement(positionsOnTheSameLand, this.random);

        return [origin, otherPosition];
    }

    findSameLand(origin) {
        let isSameLandMap = Array.from({ length: this.map.length }, () =>
            Array.from({ length: this.map[0].length }, () => false),
        );

        this.noteSameLandDown(origin, isSameLandMap);
        isSameLandMap[origin.x][origin.y] = false;

        const sameLand = [];
        for (let x = 0; x < isSameLandMap.length; x++) {
            for (let y = 0; y < isSameLandMap[x].length; y++) {
                if (isSameLandMap[x][y]) {
                    sameLand.push({ x: x, y: y });
                }
            }
        }
        return sameLand;
    }

    noteSameLandDown(current, foundPositionsMap) {
        if (this.map[current.x][current.y] !== TERRAIN.HOLE) {
            foundPositionsMap[current.x][current.y] = true;
            this.positionsAround(current).forEach(neighbour => {
                if (!foundPositionsMap[neighbour.x][neighbour.y]) {
                    this.noteSameLandDown(neighbour, foundPositionsMap);
                }
            });
        }
    }

    positionsAround(position) {
        return [
            { x: position.x, y: (position.y - 1 + this.map[0].length) % this.map[0].length },
            { x: (position.x + 1) % this.map.length, y: position.y },
            { x: position.x, y: (position.y + 1) % this.map[0].length },
            { x: (position.x - 1 + this.map.length) % this.map.length, y: position.y },
        ];
    }

    isOnMap(position) {
        return position.x >= 0 && position.y >= 0 && position.x < this.map.length && position.y < this.map[0].length;
    }
}

module.exports = GameFactory;
