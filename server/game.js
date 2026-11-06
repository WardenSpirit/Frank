const { TERRAIN, DIRECTION } = require('../shared/protocol.json');

class Game {
    /**
     * @param settings The settings applied to the game, which clients receive with it.
     */
    constructor(map, treasurePosition, heroPosition, gameId, settings) {
        this.map = map;
        this.treasurePosition = treasurePosition;
        this.heroPosition = heroPosition;
        this.gameId = gameId;
        this.settings = settings;
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

        const mapWidth = this.map.length;
        const mapHeight = this.map[0].length;
        let potentialNewHeroPosition;
        switch (direction) {
            case DIRECTION.UP:
                potentialNewHeroPosition = { x: this.heroPosition.x, y: (this.heroPosition.y - 1 + mapHeight) % mapHeight };
                break;
            case DIRECTION.RIGHT:
                potentialNewHeroPosition = { x: (this.heroPosition.x + 1) % mapWidth, y: this.heroPosition.y };
                break;
            case DIRECTION.DOWN:
                potentialNewHeroPosition = { x: this.heroPosition.x, y: (this.heroPosition.y + 1) % mapHeight };
                break;
            case DIRECTION.LEFT:
                potentialNewHeroPosition = { x: (this.heroPosition.x - 1 + mapWidth) % mapWidth, y: this.heroPosition.y };
                break;
        }

        this.heroPosition = potentialNewHeroPosition;
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
            return this.map[this.heroPosition.x][this.heroPosition.y] === TERRAIN.HOLE;
        }
    }
}

module.exports = Game;