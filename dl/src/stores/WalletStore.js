import alt from "alt-instance"
import WalletActions from "actions/WalletActions"
import BaseStore from "stores/BaseStore"
import iDB from "idb-instance"

class WalletStore extends BaseStore {
    
    constructor() {
        super()
        this.state = this._getInitialState()
        this.bindActions(WalletActions)
        super._export("init", "hasWallet")
    }
    
    _getInitialState() {
        return {
            current_wallet: undefined,
            wallet_names: []
        }
    }
    
    init() {
        return Promise.all([
            iDB.root.getProperty("current_wallet", "default").then( current_wallet => {
                this.setState({current_wallet})
            }),
            iDB.root.getProperty("wallet_names", ["default"]).then( wallet_names => {
                this.setState({wallet_names})
            })
        ])
    }
    
    onRestore({wallet_name, wallet_object}) {
        return iDB.restore(wallet_name, wallet_object).then( () => {
            iDB.root.getProperty("wallet_names", ["default"]).then( wallet_names => {
                wallet_names.push(wallet_name)
                iDB.root.setProperty("wallet_names", wallet_names).then( ()=> {
                    this.setState({wallet_names})
                })
            })
        }).catch( event => {
            var error = event.target.error
            console.error("Error saving wallet to database",
                error.name, error.message, error)
            throw new Error("Error saving wallet to database")
        })
            
    }
    
    hasWallet(wallet_name) {
        for(let _wallet_name of this.state.wallet_names)
            if(_wallet_name === wallet_name)
                return true
    }
    
    onCreateWalletJson(walletObject) {
        console.log('... walletObject',walletObject)
        
    }
    
}

export var WalletStoreWrapped = alt.createStore(WalletStore)
export default WalletStoreWrapped
