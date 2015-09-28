import alt from "alt-instance"
import WalletDb from "stores/WalletDb"
import PrivateKeyStore from "stores/PrivateKeyStore"
import PrivateKeyActions from "actions/PrivateKeyActions"
import WalletActions from "actions/WalletActions"
import ChainStore from "api/ChainStore"
import BaseStore from "stores/BaseStore"
import iDB from "idb-instance"
import Immutable from "immutable"

/**  High-level container for managing multiple wallets.
*/
class WalletManagerStore extends BaseStore {
    
    constructor() {
        super()
        this.state = this._getInitialState()
        this.bindListeners({
            onRestore: WalletActions.restore,
            onSetWallet: WalletActions.setWallet
        })
        super._export("init", "setNewWallet", "onDeleteAllWallets")
    }
    
    _getInitialState() {
        return {
            new_wallet: undefined,// pending restore
            current_wallet: undefined,
            wallet_names: Immutable.Set()
        }
    }
    
    /** This will change the current wallet the newly restored wallet. */
    onRestore({wallet_name, wallet_object}) {
        iDB.restore(wallet_name, wallet_object).then( () => {
            return this.onSetWallet({wallet_name})
        }).catch( error => {
            console.error(error)
            return Promise.reject(error)
        })
    }
    
    /** This may result in a new wallet name being added, only in this case
        should a <b>create_wallet_password</b> be provided.
    */
    onSetWallet({wallet_name = "default", create_wallet_password, resolve}) {
        var p = new Promise( resolve => {
            
            if( /[^a-z0-9_-]/.test(wallet_name) || wallet_name === "" )
                throw new Error("Invalid wallet name")
            
            if(this.state.current_wallet === wallet_name) {
                resolve()
                return
            }
            
            var add
            if( ! this.state.wallet_names.has(wallet_name) ) {
                var wallet_names = this.state.wallet_names.add(wallet_name)
                this.setState({wallet_names})
                add = iDB.root.setProperty("wallet_names", wallet_names)
            }
            
            var current = iDB.root.setProperty("current_wallet", wallet_name)
            
            resolve( Promise.all([ add, current ]).then(()=>{
                // The database must be closed and re-opened first before the current
                // application code can initialize its new state.
                iDB.close()
                ChainStore.clearCache()
                return iDB.init_instance().init_promise.then(()=>{ 
                    return Promise.all([
                        WalletDb.loadDbData(),
                        PrivateKeyActions.loadDbData(),
                        AccountStore.loadDbData()
                    ]).then(()=>{
                        // Update state here again to make sure listeners re-render
                        
                        if( ! create_wallet_password) {
                            this.setState({current_wallet: wallet_name})
                            return
                        }
                        
                        return WalletDb.onCreateWallet(
                            create_wallet_password,
                            null, //brainkey,
                            true //unlock
                        ).then(()=>
                            this.setState({current_wallet: wallet_name}))
                        
                    })
                })
            }))
        }).catch( error => {
            console.error(error)
            return Promise.reject(error)
        })
        if(resolve) resolve(p)
    }
    
    /** Used by the components during a pending wallet create. */
    setNewWallet(new_wallet) {
        this.setState({new_wallet})
    }
    
    init() {
        return iDB.root.getProperty("current_wallet").then(
            current_wallet => {
            return iDB.root.getProperty("wallet_names", []).then( wallet_names => {
                this.setState({
                    wallet_names: Immutable.Set(wallet_names),
                    current_wallet
                })
            })
        })
    }
    
    onDeleteAllWallets() {
        var deletes = []
        this.state.wallet_names.forEach( wallet_name =>
            deletes.push(this.onDeleteWallet(wallet_name)))
        return Promise.all(deletes)
    }
    
    onDeleteWallet(delete_wallet_name) {
        return new Promise( resolve => {
            var {current_wallet, wallet_names} = this.state
            if( ! wallet_names.has(delete_wallet_name) ) {
                throw new Error("Can't delete wallet, does not exist in index")
            }
            wallet_names = wallet_names.delete(delete_wallet_name)
            if(current_wallet == delete_wallet_name) {
                current_wallet = undefined
            }
            this.setState({current_wallet, wallet_names})
            var database_name = iDB.getDatabaseName(delete_wallet_name)
            var req = iDB.impl.deleteDatabase(database_name)
            resolve( database_name )
        })
    }
    
}

export var WalletManagerStoreWrapped = alt.createStore(WalletManagerStore, "WalletManagerStore");
export default WalletManagerStoreWrapped
