class GameState {
    static {
        this.MAP_SIZE = 14;
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

        for (let i = 0; i < GameState.MAP_SIZE; i++) {
            map[i] = [];
            for (let j = 0; j < GameState.MAP_SIZE; j++) {
                map[i][j] = terrainGenerator.next().value;
            }
        }

        return map;
    }

    * terrainGenerator() {
        let squaresToMake = GameState.MAP_SIZE * GameState.MAP_SIZE;
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
                x: GameState.getRandomIndex(this.map),
                y: GameState.getRandomIndex(this.map[0])
            };
        } while (this.map[treasurePosition.x][treasurePosition.y] === GameState.HOLE);

        return treasurePosition;
    }

    generateHeroPosition() {
        console.log("this.treasurePosition: " + this.treasurePosition);
        let heroPosition = { x: this.treasurePosition.x, y: this.treasurePosition.y };

        for (let i = 0; i < GameState.MAP_SIZE * GameState.MAP_SIZE; i++) {
            let possibleNewCoordinates = this.findPossibleMovesOut(heroPosition);
            let randomPossibleNewCoordinates = possibleNewCoordinates[GameState.getRandomIndex(possibleNewCoordinates)];
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
        ].filter(coordinates => isPositionWithinMapBounds(coordinates) && this.isPath(coordinates));
    }

    isPath(coordinates) {
        console.log("coordinates: [" + coordinates.x + "; " + coordinates.y + "]");
        return this.map[coordinates.x][coordinates.y] === GameState.PATH;
    }

    static getRandomIndex(array) {
        return Math.floor(Math.random(array.length));
    }


    performMoves() {
        for (let i = 0; i < moves.length; i++) {
            performMove(moves[i]);
            if (!this.isGameBeingFinished()) {
                break;
            }
        }
    
        function performMove(direction) {
        
            let potentialNewHeroPosition;
            switch (direction) {
                case "UP":
                    potentialNewHeroPosition = { x: game.heroPosition.x, y: game.heroPosition.y - 1 };
                    break;
                case "RIGHT":
                    potentialNewHeroPosition = { x: game.heroPosition.x + 1, y: game.heroPosition.y };
                    break;
                case "DOWN":
                    potentialNewHeroPosition = { x: game.heroPosition.x, y: game.heroPosition.y + 1 };
                    break;
                case "LEFT":
                    potentialNewHeroPosition = { x: game.heroPosition.x - 1, y: game.heroPosition.y };
                    break;
            }
        
            if (isPositionWithinMapBounds(potentialNewHeroPosition)) {
                game.heroPosition = potentialNewHeroPosition;
            }
        }
    }
    
    isPositionWithinMapBounds(inspectedPosition) {
        return inspectedPosition.x >= 0 && inspectedPosition.x < game.map.length &&
            inspectedPosition.y >= 0 && inspectedPosition.y < game.map[0].length;
    }
    
    isGameBeingFinished() {
        return didHeroFindTreasure() || didHeroStepInHole();
        function didHeroFindTreasure() {
            return game.heroPosition.x == game.treasurePosition.x && game.heroPosition.y == game.treasurePosition.y;
        }
        function didHeroStepInHole() {
            return game.map[game.heroPosition.x][game.heroPosition.y] == Game.HOLE;
        }
    }
}
module.exports = GameState;