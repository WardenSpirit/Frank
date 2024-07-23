const params = require('./params.json');
const getRandomIndex = require('./array');
const GameState = require('./gameState')
const dataRepresentation = require('./dataRepresentation');

class GameFactory {

    createGame() {
        //generating function must be called in this order
        this.map = this.generateMap();
        this.treasurePosition = this.generateTreasurePosition();
        this.heroPosition = this.generateHeroPosition();

        return new GameState(this.map, this.treasurePosition, this.heroPosition);
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

    generateTreasurePosition() {
        let treasurePosition;

        do {
            treasurePosition =
            {
                x: getRandomIndex(this.map),
                y: getRandomIndex(this.map[0])
            };
        } while (this.map[treasurePosition.x][treasurePosition.y] === dataRepresentation.HOLE ||
            isTreasureSurroundedByHoles.call(this));

        return treasurePosition;

        function isTreasureSurroundedByHoles() {
            return (treasurePosition.y == 0 || this.map[treasurePosition.x][treasurePosition.y - 1] == dataRepresentation.HOLE) &&
                (treasurePosition.x == this.map.length - 1 || this.map[treasurePosition.x + 1][treasurePosition.y] == dataRepresentation.HOLE) &&
                (treasurePosition.y == this.map[0].length - 1 || this.map[treasurePosition.x][treasurePosition.y + 1] == dataRepresentation.HOLE) &&
                (treasurePosition.x == 0 || this.map[treasurePosition.x - 1][treasurePosition.y] == dataRepresentation.HOLE);
        }
    }

    /**
     * Calculates and returns a pseudorandom position on the map. The function uarantees,
     * that there exists at least one path from the hero to the treasure,
     * which means it does not break the winnability of the game.
     * @returns A pseudorandom position intended for the hero.
     */
    generateHeroPosition() {
        let heroPosition = { x: this.treasurePosition.x, y: this.treasurePosition.y };

        let numberOfRepositions = 2 * params.MAP_WIDTH * params.MAP_HEIGHT;
        for (let i = 0; i < numberOfRepositions; i++) {
            let possibleNewCoordinates = this.findPossibleMovesOut(heroPosition);
            let randomPossibleNewCoordinates = possibleNewCoordinates[getRandomIndex(possibleNewCoordinates)];
            heroPosition = randomPossibleNewCoordinates;
        }
        while(arePositionsSame(heroPosition, this.treasurePosition)) {
            let possibleNewCoordinates = this.findPossibleMovesOut(heroPosition);
            let randomPossibleNewCoordinates = possibleNewCoordinates[getRandomIndex(possibleNewCoordinates)];
            heroPosition = randomPossibleNewCoordinates;
        }

        return heroPosition;

        function arePositionsSame(firstPosition, secondPosition) {
            return firstPosition.x == secondPosition.x && firstPosition.y == secondPosition.y;
        }
    }

    /**
     * Finds all the moves from the specified position that are safe. In other words, they don't lead to a hole.
     * @param heroPosition The default position of the moves that are looked for.
     * @returns Safe moves from the specified position.
     */
    findPossibleMovesOut(heroPosition) {
        return [
            { x: heroPosition.x, y: heroPosition.y - 1 },
            { x: heroPosition.x + 1, y: heroPosition.y },
            { x: heroPosition.x, y: heroPosition.y + 1 },
            { x: heroPosition.x - 1, y: heroPosition.y },
            { x: heroPosition.x, y: heroPosition.y }
        ].filter(coordinates => GameState.isPositionWithinMapBounds(coordinates) && this.isPath(coordinates));
    }

    isPath(coordinates) {
        return this.map[coordinates.x][coordinates.y] === dataRepresentation.PATH;
    }
}

module.exports = GameFactory;