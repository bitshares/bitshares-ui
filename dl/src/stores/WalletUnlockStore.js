import alt from "alt-instance"
import WalletUnlockActions from "actions/WalletUnlockActions"
import SettingsActions from "actions/SettingsActions"
import WalletDb from "stores/WalletDb"

var ls = typeof localStorage === "undefined" ? null : localStorage;
const STORAGE_KEY = "__graphene__";

class WalletUnlockStore {
    
    constructor() {
        this.bindActions(WalletUnlockActions)
        this.state = {locked: true}

        this.walletLockTimeout = 60 * 10; // seconds (10 minutes)
        this.timeout = null;

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting
        });

        let timeoutSetting = this._getTimeout();

        if (timeoutSetting) {
            this.walletLockTimeout = timeoutSetting;
        }

    }
    
    onUnlock({resolve, reject}) {
        //DEBUG console.log('... onUnlock setState', WalletDb.isLocked())
        //
    
        this._setLockTimeout();
        if( ! WalletDb.isLocked()) {
            resolve()
            return
        }

        this.setState({resolve, reject, locked: WalletDb.isLocked()});
    }
    
    onLock({resolve}) {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock', WalletDb.isLocked())
        if(WalletDb.isLocked()) {
            resolve()
            return
        }
        WalletDb.onLock()
        this.setState({resolve:null, reject:null, locked: WalletDb.isLocked()})
        resolve()
    }
    
    onCancel() {
        //this.state.reject();
        this.setState({resolve:null, reject:null});
    }
    
    onChange() {
        this.setState({locked: WalletDb.isLocked()})
    }


    onChangeSetting(payload) {
        if (payload.setting === "walletLockTimeout") {
            this.walletLockTimeout = payload.value;
            this._clearLockTimeout();
            this._setLockTimeout();
        }
    }


    _setLockTimeout() {
        this._clearLockTimeout();
        this.timeout = setTimeout(() => {
            if (!WalletDb.isLocked()) {
                console.log("auto locking after", this.walletLockTimeout, "s");
                WalletDb.onLock()
                this.setState({locked: true})
            };
        }, this.walletLockTimeout * 1000);
    }

    _clearLockTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    _getTimeout() {
        if (ls) {
            let value = parseInt(JSON.parse(ls.getItem(STORAGE_KEY + "lockTimeout")), 10);
            if (value && !isNaN(value) && typeof value === "number") {
                return value;
            } else {
                return null;
            }
        }
    }
}

export default alt.createStore(WalletUnlockStore, 'WalletUnlockStore')
