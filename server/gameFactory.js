const params = require('./params.json');
const getRandomIndex = require('./array').getRandomIndex;
const Game = require('./game')
const dataRepresentation = require('./dataRepresentation');
const { getRandomElement } = require('./array');

class GameFactory {

    createGame() {
        //generating function must be called in this order
        this.map = this.generateMap();
        let positionsOnTheSameLand = this.generateTwoSameLandPositions();
        this.heroPosition = positionsOnTheSameLand[0];
        this.treasurePosition = positionsOnTheSameLand[1];

        return new Game(this.map, this.treasurePosition, this.heroPosition);
    }

    generateMap() {
        let map = [];
        const terrainGenerator = this.terrainGenerator();

        for (let x = 0; x < params.MAP_WIDTH; x++) {
            map[x] = [];
            for (let y = 0; y < params.MAP_HEIGHT; y++) {
                map[x][y] = terrainGenerator.next().value;
            }
        }

        return map;
    }

    * terrainGenerator() {
        let squaresToMake = params.MAP_WIDTH * params.MAP_HEIGHT;
        let holesToMake = squaresToMake * params.HOLE_RATIO;

        while (squaresToMake > 0) {
            if (Math.random() * squaresToMake > holesToMake) {
                yield dataRepresentation.PATH;
            } else {
                yield dataRepresentation.HOLE;
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
                x: getRandomIndex(this.map),
                y: getRandomIndex(this.map[0])
            };
            positionsOnTheSameLand = this.findSameLand(origin);
        } while (positionsOnTheSameLand.length == 0);
        
        let otherPosition = getRandomElement(positionsOnTheSameLand);

        return [origin, otherPosition];
    }

    findSameLand(origin) {
        let isSameLandMap = Array.from({ length: this.map.length },
            () => Array.from({ length: this.map[0].length },
                () => false));

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
        if (this.map[current.x][current.y] !== dataRepresentation.HOLE) {
            foundPositionsMap[current.x][current.y] = true;
            this.positionsAround(current).forEach(neighbour => {
                if (!foundPositionsMap[neighbour.x][neighbour.y]) {
                    this.noteSameLandDown(neighbour, foundPositionsMap)
                }
            });
        }
    };

    positionsAround(position) {
        return [
            { x: position.x, y: position.y - 1 },
            { x: position.x + 1, y: position.y },
            { x: position.x, y: position.y + 1 },
            { x: position.x - 1, y: position.y }]
            .filter(position => this.isOnMap(position));
    };

    isOnMap(position) {
        return (position.x >= 0 && position.y >= 0 && position.x < this.map.length && position.y < this.map[0].length);
    }
}

module.exports = GameFactory;