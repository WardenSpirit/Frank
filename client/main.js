import * as connection from "./connection.js";
import * as model from "./model.js";
import * as controls from "./controls.js";

// The entry point: connects to the server and passes its messages to the model and the controls.
connection.connect({
    onOpen: () => model.openConnection(),
    onClose: () => model.closeConnection(),
    onGame: game => {
        model.updateGame(game);
        controls.allowTurn();
    },
    onMoves: moves => {
        if (model.applyMoves(moves)) {
            controls.allowTurn();
        }
    },
    onPlayers: players => model.setPlayers(players),
    onRejected: () => model.rejectConnection(),
});
