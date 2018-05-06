import React from "react";
import AltContainer from "alt-container";
import Translate from "react-translate-component";
import counterpart from "counterpart";

import WalletUnlockStore from "stores/WalletUnlockStore";
import SettingsActions from "actions/SettingsActions";

const LoginTypeSelectorView = ({value, onChange}) => (
    <div className="login-type-selector">
        <label className="left-label login-label">
            <Translate content="account.login_with" />
        </label>
        <select value={value} onChange={onChange} className="login-select">
            <option value="cloud">
                {counterpart.translate("account.name")} ({counterpart
                    .translate("wallet.password_model")
                    .toLowerCase()})
            </option>
            <option value="local">
                {counterpart.translate("wallet.key_file")} ({counterpart
                    .translate("wallet.wallet_model")
                    .toLowerCase()})
            </option>
        </select>
    </div>
);

const LoginTypeSelector = () => (
    <AltContainer
        stores={[WalletUnlockStore]}
        inject={{
            value: () =>
                WalletUnlockStore.getState().passwordLogin ? "cloud" : "local"
        }}
        actions={props => ({
            onChange: event => {
                const newType = event.target.value;
                const validValues = ["cloud", "local"];
                if (!newType in validValues)
                    throw new Error("Invalid login type value");
                return SettingsActions.changeSetting({
                    setting: "passwordLogin",
                    value: newType === "cloud"
                });
            }
        })}
    >
        <LoginTypeSelectorView {...this.props} />
    </AltContainer>
);

export default LoginTypeSelector;
