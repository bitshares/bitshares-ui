import alt from "alt-instance"
import WalletActions from "actions/WalletActions"
import WalletCreateActions from "actions/WalletCreateActions"
import BaseStore from "stores/BaseStore"
import iDB from "idb-instance"
import Immutable from "immutable"


class WalletStore extends BaseStore {
    
    constructor() {
        super()
        this.state = this._getInitialState()
        this.bindActions([ WalletActions, WalletCreateActions ])
        super._export("init")
    }
    
    _getInitialState() {
        return {
            current_wallet: undefined,
            wallet_names: Immutable.Set()
        }
    }
    
    init() {
        return Promise.all([
            iDB.root.getProperty("current_wallet").then( current_wallet => {
                this.setState({ current_wallet })
            }),
            iDB.root.getProperty("wallet_names", []).then( wallet_names => {
                this.setState({
                    wallet_names: Immutable.Set(wallet_names)
                })
            })
        ])
    }
    
    onDefaultWalletCreated() {
        Promise.all([
            iDB.root.setProperty("current_wallet", "default"),
            iDB.root.setProperty("wallet_names", ["default"])
        ]).then(()=>{
            this.setState({
                current_wallet: "default",
                wallet_names: Immutable.Set(["default"])
            })
        })
    }
    
    onRestore({wallet_name, wallet_object}) {
        return iDB.restore(wallet_name, wallet_object).then( () => {
            var wallet_names = this.state.wallet_names.add(wallet_name)
            iDB.root.setProperty("wallet_names", wallet_names).then( ()=> {
                this.setState({wallet_names})
            })
        }).catch( event => {
            var error = event.target.error
            console.error("Error saving wallet to database",
                error.name, error.message, error)
            throw new Error("Error saving wallet to database")
        })
    }
    
}

export var WalletStoreWrapped = alt.createStore(WalletStore)
export default WalletStoreWrapped
