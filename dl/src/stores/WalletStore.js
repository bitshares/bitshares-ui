import alt from "alt-instance"
import WalletDb from "stores/WalletDb"
import PrivateKeyStore from "stores/PrivateKeyStore"
import WalletActions from "actions/WalletActions"
import WalletCreateActions from "actions/WalletCreateActions"
import ChainStore from "api/ChainStore"
import BaseStore from "stores/BaseStore"
import iDB from "idb-instance"
import Immutable from "immutable"


class WalletStore extends BaseStore {
    
    constructor() {
        super()
        this.state = this._getInitialState()
        this.bindListeners({
            onRestore: WalletActions.restore,
            onDefaultWalletCreated: WalletCreateActions.defaultWalletCreated,
            onCreateWallet: WalletActions.createWallet,
            onChangeWallet: WalletActions.changeWallet
        })
        super._export("init","getMyAuthorityForAccount", "setNewWallet",
            "onChangeWallet", "addWalletName")
    }
    
    _getInitialState() {
        return {
            new_wallet: undefined,// pending restore
            current_wallet: undefined,
            wallet_names: Immutable.Set()
        }
    }
    
    onCreateWallet({wallet_name, password}) {
        // The database must be renamed first (via onChangeWallet) before
        // the current application code can initialize new data structures.
        WalletStoreWrapped.onChangeWallet({wallet_name}).then( ()=> {
            return WalletDb.onCreateWallet(
                password,
                null, //brainkey,
                true //unlock
            ).then( ()=> {
                return WalletStoreWrapped.addWalletName(wallet_name).then(()=>
                    this.setState({current_wallet: wallet_name}))
            })
        }).catch( error => {
            console.error(error)
        })
    }
    
    addWalletName(wallet_name) {
        var wallet_names = this.state.wallet_names.add(wallet_name)
        return iDB.root.setProperty("wallet_names", wallet_names)
    }
    
    onChangeWallet({wallet_name}) {
        if(this.state.wallet_names.size == 0)
            wallet_name = "default"
        
        if( ! wallet_name)
            throw new Error("Wallet name is required")
        
        return iDB.root.setProperty("current_wallet", wallet_name).then(()=>{
            iDB.close() // after closing, open a new "current_wallet" database
            return iDB.init_instance().init_promise.then(()=>{ 
                return Promise.all([
                    WalletDb.loadDbData(),
                    PrivateKeyStore.loadDbData(),
                    AccountStore.loadDbData()//, ChainStore.init() //setState(...): Cannot update during an existing state transition
                ]).then(()=>{
                    this.setState({current_wallet: wallet_name})
                })
            })
        })
    }
    
    setNewWallet(new_wallet) {
        this.setState({new_wallet})
    }
    
    init() {
        return iDB.root.getProperty("current_wallet").then(
            current_wallet => {
            return iDB.root.getProperty("wallet_names", []).then( wallet_names => {
                if( ! current_wallet && wallet_names.length) {
                    current_wallet = "default"
                }
                this.setState({
                    wallet_names: Immutable.Set(wallet_names),
                    current_wallet
                })
            })
        })
    }
    
    /**
        @todo "partial"
        @return string "none", "full", "partial"
    */
    getMyAuthorityForAccount(account) {
        if(account === undefined) return undefined
        if( ! account) return null
        let my_authority = "none";
        if (account) {
            for (let k of account.owner.key_auths) {
                if (PrivateKeyStore.hasKey(k[0])) {
                    my_authority = "full";
                    break;
                }
            }
            for (let k of account.active.key_auths) {
                if (PrivateKeyStore.hasKey(k[0])) {
                    my_authority = "full";
                    break;
                }
            }
        }
        return my_authority;
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
        iDB.restore(wallet_name, wallet_object).then( () => {
            var wallet_names = this.state.wallet_names.add(wallet_name)
            return iDB.root.setProperty("wallet_names", wallet_names).then(
                ()=> {
                    this.setState({wallet_names})
                    if( ! this.state.current_wallet)
                        this.setState({ current_wallet: "default" })
                })
        }).catch( error => {
            console.error(error)
        })
    }
    
}

export var WalletStoreWrapped = alt.createStore(WalletStore)
export default WalletStoreWrapped
