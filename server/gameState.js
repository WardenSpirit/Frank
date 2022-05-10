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
        ].filter(coordinates => this.isPath(coordinates) && );
    }

    isPath(coordinates) {
        console.log("coordinates: [" + coordinates.x + "; " + coordinates.y + "]");
        return this.map[coordinates.x][coordinates.y] === GameState.PATH;
    }

    static getRandomIndex(array) {
        return Math.floor(Math.random(array.length));
    }
}
module.exports = GameState;