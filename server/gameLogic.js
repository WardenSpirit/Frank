module.exports = {
    Game: class {
        static MAP_SIZE = 14;

        constructor() {
            // must be generated in this order()
            this.treasurePosition = { x: getRandomIndex(this.map), y: this.getRandomIndex(this.map[0]) };
            this.map = this.generateNewMap();
            this.heroPosition = this.generateNewHeroPosition;
        }

        static generateNewMap() {
            let map = [];

            for (let i = 0; i < MAP_SIZE; i++) {
                map[i] = [];

                for (let j = 0; j < MAP_SIZE; j++) {

                    let terrain = this.terrainGenerator.next().value;
                    map[i][j] = terrain;
                }
            }

            map[treasurePosition.x][treasurePosition.y] = 0;

            return map;
        }

        static terrainGenerator = function* () {
            let squaresToMake = MAP_SIZE * MAP_SIZE;
            let holesToMake = squaresToMake / 4

            while (squaresToMake > 0) {
                if (Math.random() * squaresToMake > holesToMake) {
                    yield 0;
                } else {
                    yield 1;
                    holesToMake--;
                }
                squaresToMake--;
            }
        }

        static generateNewHeroPosition(treasureX, treasureY) {
            x = treasureX;
            y = treasureY;
            for (let i = 0; i < MAP_SIZE * MAP_SIZE; i++) {
                let possibleMoves = findPossibleMovesOut(x, y);
                let randomPossibleMove = possibleMoves[getRandomIndex(possibleMoves)];
                x = randomPossibleMove.x;
                y = randomPossibleMove.y;
            }
            return { x: x, y: y }
        }

        static isPath(x, y) {
            return this.map[x][y] === 0;
        }

        static findPossibleMovesOut(x, y) {
            let potentialMoves = [{ x: x + 1, y: y }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x, y: y - 1 }];
            let possibleMoves = [];
            potentialMoves.forEach(coordinates => {
                if (isPath(coordinates.x, coordinates.y)) {
                    possibleMoves[possibleMoves.length] = coordinates;
                }
            });
        }

        static getRandomIndex(array) {
            return Math.floor(Math.random(array.length));
        }
    }
};