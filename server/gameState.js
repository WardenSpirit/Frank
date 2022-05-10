module.exports = {
    GameState: class {
        static MAP_SIZE = 14;
        static PATH = 0;
        static HOLE = 1;

        constructor() {
            //generating function must be called in this order
            this.map = generateMap();
            this.treasurePosition = generateTreasurePosition()
            this.heroPosition = generateHeroPosition(treasurePosition);
        }

        static generateMap() {
            let map = [];

            for (let i = 0; i < MAP_SIZE; i++) {
                map[i] = [];
                
                for (let j = 0; j < MAP_SIZE; j++) {
                    map[i][j] = this.terrainGenerator.next().value;
                }
            }

            return map;
        }

        *terrainGenerator() {
            let squaresToMake = MAP_SIZE * MAP_SIZE;
            let holesToMake = squaresToMake * HOLE_RATIO;

            while (squaresToMake > 0) {
                if (Math.random() * squaresToMake > holesToMake) {
                    yield PATH;
                } else {
                    yield HOLE;
                    holesToMake--;
                }
                squaresToMake--;
            }
        }

        generateTreasurePosition() {
            do {
                treasurePosition = { x: getRandomIndex(this.map), y: this.getRandomIndex(this.map[0]) };
            } while (this.map[treasurePosition.x][treasurePosition.y] === HOLE);

        }

        generateHeroPosition(treasurePosition) {
            let heroPosition = { x: treasurePosition.x, y: treasurePosition.y };

            for (let i = 0; i < MAP_SIZE * MAP_SIZE; i++) {
                let possibleNewCoordinates = findPossibleMovesOut(heroPosition);
                let randomPossibleNewCoordinates = possibleNewCoordinates[getRandomIndex(possibleNewCoordinates)];
                heroPosition = randomPossibleNewCoordinates;
            }

            return heroPosition;
        }

        findPossibleMovesOut(newHeroPosition) {
            return [
                { x: newHeroPosition.x, y: newHeroPosition.y - 1 },
                { x: newHeroPosition.x + 1, y: newHeroPosition.y },
                { x: newHeroPosition.x, y: newHeroPosition.y + 1 },
                { x: newHeroPosition.x - 1, y: newHeroPosition.y }
            ].filter(coordinates => isPath(coordinates));
        }

        isPath(coordinates) {
            return this.map[coordinates.x][coordinates.y] === PATH;
        }

        static getRandomIndex(array) {
            return Math.floor(Math.random(array.length));
        }
    }
};