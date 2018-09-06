import alt from "alt-instance";
import ReportActions from "actions/ReportActions";
import SettingsActions from "actions/SettingsActions";
import WalletDb from "stores/WalletDb";
import ls from "common/localStorage";

const STORAGE_KEY = "__graphene__";
let ss = new ls(STORAGE_KEY);

class ReportStore {
    constructor() {
        this.bindActions(ReportActions);

        // can't use settings store due to possible initialization race conditions
        const storedSettings = ss.get("settings_v4", {});
        if (storedSettings.passwordLogin === undefined) {
            storedSettings.passwordLogin = true;
        }
        let passwordLogin = storedSettings.passwordLogin;
        this.state = {
            locked: true,
            passwordLogin: passwordLogin
        };

        // this.walletLockTimeout = this._getTimeout(); // seconds (10 minutes)
        this.timeout = null;

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting
        });

        // let timeoutSetting = this._getTimeout();

        // if (timeoutSetting) {
        //     this.walletLockTimeout = timeoutSetting;
        // }
    }

    onOpen({resolve, reject}) {
        //DEBUG console.log('... onUnlock setState', WalletDb.isLocked())
        //
        // if (!WalletDb.isLocked()) {
        this.setState({locked: true});
        console.log("resolve() ", resolve());
        resolve();
        return;
        // }
        console.log("onOpen ");

        this.setState({resolve, reject, locked: true});
    }

    onLock({resolve}) {
        //DEBUG console.log('... ReportStore\tprogramatic lock', WalletDb.isLocked())
        if (WalletDb.isLocked()) {
            resolve();
            return;
        }
        WalletDb.onLock();
        this.setState({
            resolve: null,
            reject: null,
            locked: WalletDb.isLocked()
        });
        resolve();
    }

    onCancel() {
        if (typeof this.state.reject === "function")
            this.state.reject({isCanceled: true});
        this.setState({resolve: null, reject: null});
    }

    onChange() {
        this.setState({locked: WalletDb.isLocked()});
    }

    onChangeSetting(payload) {
        if (payload.setting === "walletLockTimeout") {
            this.walletLockTimeout = payload.value;
            this._clearLockTimeout();
            this._setLockTimeout();
        } else if (payload.setting === "passwordLogin") {
            this.setState({
                passwordLogin: payload.value
            });
        }
    }
}

export default alt.createStore(ReportStore, "ReportStore");
