const GameFactory = require('./gameFactory');
const params = require('./params.json');
const dataRepresentation = require('./dataRepresentation');

class GameState {
    constructor(map, treasurePosition, heroPosition) {
        this.map = map;
        this.treasurePosition = treasurePosition;
        this.heroPosition = heroPosition;
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
        return inspectedPosition.x >= 0 && inspectedPosition.x < params.MAP_WIDTH &&
            inspectedPosition.y >= 0 && inspectedPosition.y < params.MAP_HEIGHT;
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
            return this.map[this.heroPosition.x][this.heroPosition.y] == dataRepresentation.HOLE;
        }
    }
}

module.exports = GameState;