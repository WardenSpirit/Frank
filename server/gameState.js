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

    generateTreasurePosition() {        //game crashes when it's generated position is surrounded by holes
        let treasurePosition;

        do {
            treasurePosition =
            {
                x: getRandomIndex(this.map),
                y: getRandomIndex(this.map[0])
            };
        } while (this.map[treasurePosition.x][treasurePosition.y] === GameState.HOLE);

        return treasurePosition;
    }

    generateHeroPosition() {
        let heroPosition = { x: this.treasurePosition.x, y: this.treasurePosition.y };

        for (let i = 0; i < GameState.MAP_WIDTH  * GameState.MAP_HEIGHT; i++) {
            let possibleNewCoordinates = this.findPossibleMovesOut(heroPosition);
            let randomPossibleNewCoordinates = possibleNewCoordinates[getRandomIndex(possibleNewCoordinates)];
            heroPosition = randomPossibleNewCoordinates;
        }

        return heroPosition;
    }

    findPossibleMovesOut(heroPosition) {
        return [
            { x: heroPosition.x, y: heroPosition.y - 1 },
            { x: heroPosition.x + 1, y: heroPosition.y },
            { x: heroPosition.x, y: heroPosition.y + 1 },
            { x: heroPosition.x - 1, y: heroPosition.y }
        ].filter(coordinates => GameState.isPositionWithinMapBounds(coordinates) && this.isPath(coordinates));
    }

    isPath(coordinates) {
        return this.map[coordinates.x][coordinates.y] === GameState.PATH;
    }


    performMoves(moves) {
        for (let i = 0; i < moves.length; i++) {
            this.performMove(moves[i]);
            if (!this.isGameBeingFinished()) {
                break;
            }
        }
    }

    performMove(direction) {

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