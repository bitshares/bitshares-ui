import alt from "alt-instance"
import WalletDb from "stores/WalletDb"
import AccountRefsStore from "stores/AccountRefsStore"
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore"
import CachedPropertyStore from "stores/CachedPropertyStore"
import WalletActions from "actions/WalletActions"
import { ChainStore, Apis } from "@graphene/chain"
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
        super._export("setState", "onDeleteWallet")
    }
    
    _getInitialState() {
        return {
            new_wallet: undefined// pending restore
        }
    }
    
    /** Create the wallet. */
    onRestore({ wallet_name, wallet_object, username = "", password }) {
        
        console.log('WalletManagerStore\trestore', wallet_name)
        
        if( /[^a-z0-9_-]/.test(wallet_name) || wallet_name === "" )
            throw new Error("Invalid wallet name")
        
        let wallet
        WalletDb.logout()
        WalletDb.openWallet(wallet_name).then( w => {
            wallet = w
            wallet_object = wallet_object.set("public_name", wallet_name)// if different
            if(wallet_object.has("create_token"))
                wallet.storage.setState({ remote_copy: true })
            
            wallet.wallet_object = wallet_object
        })
        .then(()=> this.onSetWallet({ wallet_name }))
        .then(()=> this.setState({ restored_wallet_name: wallet_name }))
        .then(()=> WalletDb.login({ password, username }))// Could "Conflict" with server version
        .catch( error =>{
            this.setState({ restore_error: error })
            console.error("WalletManagerStore\tonRestore", error)
            throw error
        })
        .then(()=> this.setState({ restore_error: null }))
    }
    
    /** This may result in a new wallet name being added, only in this case
        should a `create_wallet_auth` and `brnkey` be provided.
    */
    onSetWallet({wallet_name, create_wallet_auth, brnkey, resolve}) {
            
        if( /[^a-z0-9_-]/.test(wallet_name) || wallet_name === "" )
            throw new Error("Invalid wallet name")
        
        // let p = iDB.root.setProperty("current_wallet", wallet_name)
        // .then(()=>{
        //     // The database must be closed and re-opened first before the current
        //     // application code can initialize its new state.
        //     iDB.close()
        //     ChainStore.clearCache()
        //     BalanceClaimActiveStore.reset()
        // })
        // .then(()=> iDB.init_instance().init_promise )
        // .then(()=> {
        //     
        //     // Stores may reset when loadDbData is called
        //     // Make sure the database is ready when calling CachedPropertyStore.reset() 
        //     CachedPropertyStore.reset()
        //     return WalletDb.openWallet(wallet_name)
        // })
        // .then(()=> AccountStore.loadDbData())
        // .then(()=> AccountRefsStore.loadDbData())
        // .then(()=>{
        // })
            
        let p = Promise.resolve()
        .then(()=> WalletDb.openWallet(wallet_name))
        .then(()=>{
            if(create_wallet_auth)
                return WalletDb.onCreateWallet( create_wallet_auth, brnkey )
        })
        return resolve ? resolve(p) : p
    }
    
    /** Pending new wallet name (not the current_wallet).. Used by the components during a pending wallet create. */
    setState(state) {
        this.setState(state)
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
