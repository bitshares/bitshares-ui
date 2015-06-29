import key from "common/key_utils"
import v from "common/validation"

var alt = require("../alt-instance")

class WalletActions {
    
    constructor() {
        // https://github.com/cryptonomex/graphene-ui/issues/21
        //this.generateActions('create', 'lock');
    }

}

module.exports = alt.createActions(WalletActions);
