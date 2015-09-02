import alt from "alt-instance"

class WalletCreateActions {

    constructor() {
        this.generateActions( 'defaultWalletCreated' )
    }
    
}
module.exports = alt.createActions(WalletCreateActions)
