import alt from "alt-instance";

class BrainkeyActions {

    setBrainkey(brnkey) {
        return brnkey;
    }

}

var BrainkeyActionsWrapped = alt.createActions(BrainkeyActions);
export default BrainkeyActionsWrapped;
