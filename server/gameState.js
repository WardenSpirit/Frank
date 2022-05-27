const getRandomIndex = require("./utils.js");

class GameState {
    static {
        this.MAP_WIDTH = 14;
        this.MAP_HEIGHT = 14;
        this.HOLE_RATIO = 0.25;
        this.PATH = 0;
        this.HOLE = 1;
    }
    constructor() {
        //generating function must be called in this order
        this.map = this.generateMap();
        this.treasurePosition = this.generateTreasurePosition();
        this.heroPosition = this.generateHeroPosition();
    }

    generateMap() {
        let map = [];
        const terrainGenerator = this.terrainGenerator();

        for (let x = 0; x < GameState.MAP_WIDTH; x++) {
            map[x] = [];
            for (let y = 0; y < GameState.MAP_HEIGHT; y++) {
                map[x][y] = terrainGenerator.next().value;
            }
        }

        return map;
    }

    * terrainGenerator() {
        let squaresToMake = GameState.MAP_WIDTH * GameState.MAP_HEIGHT;
        let holesToMake = squaresToMake * GameState.HOLE_RATIO;

        while (squaresToMake > 0) {
            if (Math.random() * squaresToMake > holesToMake) {
                yield GameState.PATH;
            } else {
                yield GameState.HOLE;
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
        } while (this.map[treasurePosition.x][treasurePosition.y] === GameState.HOLE ||
            isTreasureSurroundedByHoles.call(this));

        return treasurePosition;

        function isTreasureSurroundedByHoles() {
            return (treasurePosition.y == 0 || this.map[treasurePosition.x][treasurePosition.y - 1] == GameState.HOLE) &&
                (treasurePosition.x == this.map.length - 1 || this.map[treasurePosition.x + 1][treasurePosition.y] == GameState.HOLE) &&
                (treasurePosition.y == this.map[0].length - 1 || this.map[treasurePosition.x][treasurePosition.y + 1] == GameState.HOLE) &&
                (treasurePosition.x == 0 || this.map[treasurePosition.x - 1][treasurePosition.y] == GameState.HOLE);
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

        let numberOfRepositions = 2 * GameState.MAP_WIDTH * GameState.MAP_HEIGHT;
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
        return this.map[coordinates.x][coordinates.y] === GameState.PATH;
    }

    /**
     * Moves the hero in the specified directions and given order. Stops when the hero finds himself
     * in a hole or finds the treasure.
     */
    makeMoves(moves) {
        for (let i = 0; i < moves.length; i++) {
            this.makeMove(moves[i]);
            if (this.isGameBeingFinished()) {
                break;
            }
        }
    }

    /**
     * Makes a move in the specified direction.
     * @param direction String indicating the direction of the executed move.
     */
    makeMove(direction) {

        let potentialNewHeroPosition;
        switch (direction) {
            case "UP":
                potentialNewHeroPosition = { x: this.heroPosition.x, y: this.heroPosition.y - 1 };
                break;
            case "RIGHT":
                potentialNewHeroPosition = { x: this.heroPosition.x + 1, y: this.heroPosition.y };
                break;
            case "DOWN":
                potentialNewHeroPosition = { x: this.heroPosition.x, y: this.heroPosition.y + 1 };
                break;
            case "LEFT":
                potentialNewHeroPosition = { x: this.heroPosition.x - 1, y: this.heroPosition.y };
                break;
        }

        if (GameState.isPositionWithinMapBounds(potentialNewHeroPosition)) {
            this.heroPosition = potentialNewHeroPosition;
        }
    }

    static isPositionWithinMapBounds(inspectedPosition) {
        return inspectedPosition.x >= 0 && inspectedPosition.x < GameState.MAP_WIDTH &&
            inspectedPosition.y >= 0 && inspectedPosition.y < GameState.MAP_HEIGHT;
    }

    /**
     * Tells whether the game should end or not based on the coordinations of the hero, the treasure and the holes.
     * @returns True if the game is in an ending state.
     */
    isGameBeingFinished() {
        return didHeroFindTreasure.call(this) || didHeroStepInHole.call(this);

        function didHeroFindTreasure() {
            return this.heroPosition.x == this.treasurePosition.x && this.heroPosition.y == this.treasurePosition.y;
        }
        function didHeroStepInHole() {
            return this.map[this.heroPosition.x][this.heroPosition.y] == GameState.HOLE;
        }
    }
}

module.exports = GameState;