import alt from "alt-instance"
import WalletDb from "stores/WalletDb"
import AccountRefsStore from "stores/AccountRefsStore"
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore"
import CachedPropertyStore from "stores/CachedPropertyStore"
import WalletActions from "actions/WalletActions"
import { ChainStore } from "@graphene/chain"
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
            onSetWallet: WalletActions.setWallet,
            onSetBackupDate: WalletActions.setBackupDate,
            onSetBrainkeyBackupDate: WalletActions.setBrainkeyBackupDate
        })
        super._export("setNewWallet", "onDeleteWallet")
    }
    
    _getInitialState() {
        return {
            new_wallet: undefined// pending restore
        }
    }
    
    /** This will change the current wallet the newly restored wallet. */
    onRestore({wallet_name, wallet_object}) {
        
        console.log('wallet_name, wallet_object', wallet_name, wallet_object)
        
        // iDB.restore(wallet_name, wallet_object).then( () => {
        //     return this.onSetWallet({wallet_name})
        // }).catch( error => {
        //     console.error(error)
        //     return Promise.reject(error)
        // })
    }
    
    /** This may result in a new wallet name being added, only in this case
        should a `create_wallet_password` and `brnkey` be provided.
    */
    onSetWallet({wallet_name, create_wallet_password, brnkey, resolve}) {
            
        if( /[^a-z0-9_-]/.test(wallet_name) || wallet_name === "" )
            throw new Error("Invalid wallet name")
        
        if(WalletDb.getState().current_wallet === wallet_name) {// && ! WalletDb.isEmpty()
            if(resolve) resolve()
            return
        }
        
        let p = iDB.root.setProperty("current_wallet", wallet_name)
        .then(()=>{
            // The database must be closed and re-opened first before the current
            // application code can initialize its new state.
            iDB.close()
            ChainStore.clearCache()
            BalanceClaimActiveStore.reset()
        })
        .then(()=> iDB.init_instance().init_promise )
        .then(()=> {
            
            // Stores may reset when loadDbData is called
            // Make sure the database is ready when calling CachedPropertyStore.reset() 
            CachedPropertyStore.reset()
            WalletDb.openWallet(wallet_name)
        })
        .then(()=> AccountStore.loadDbData())
        .then(()=> AccountRefsStore.loadDbData())
        .then(()=>{
            
            // Update state here again to make sure listeners re-render
            // this.setState({})
            
            if(create_wallet_password)
                return WalletDb.onCreateWallet( create_wallet_password, brnkey )
            
        })
        if(resolve) resolve(p)
    }
    
    /** Pending new wallet name (not the current_wallet).. Used by the components during a pending wallet create. */
    setNewWallet(new_wallet) {
        this.setState({new_wallet})
    }
    
    onDeleteWallet(delete_wallet_name) {
        return WalletDb.deleteWallet(delete_wallet_name)
    }
    
    onSetBackupDate() {
        WalletDb.setBackupDate()
    }
    
    onSetBrainkeyBackupDate() {
        WalletDb.setBrainkeyBackupDate()
    }
    
}

export var WalletManagerStoreWrapped = alt.createStore(WalletManagerStore, "WalletManagerStore");
export default WalletManagerStoreWrapped
