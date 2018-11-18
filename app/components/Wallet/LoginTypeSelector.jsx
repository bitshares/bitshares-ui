import React from "react";
import AltContainer from "alt-container";
import counterpart from "counterpart";
import {Form, Select} from "bitshares-ui-style-guide";
import WalletUnlockStore from "stores/WalletUnlockStore";
import SettingsActions from "actions/SettingsActions";

const LoginTypeSelectorView = ({value, onChange}) => (
    <Form.Item label={counterpart.translate("account.login_with")}>
        <Select onChange={onChange} value={value}>
            <Select.Option value="cloud">
                {counterpart.translate("account.name")}(
                {counterpart.translate("wallet.password_model").toLowerCase()})
            </Select.Option>
            <Select.Option value="local">
                {counterpart.translate("wallet.key_file")} (
                {counterpart.translate("wallet.wallet_model").toLowerCase()})
            </Select.Option>
        </Select>
    </Form.Item>
);

const LoginTypeSelector = props => (
    <AltContainer
        stores={[WalletUnlockStore]}
        inject={{
            value: () =>
                WalletUnlockStore.getState().passwordLogin ? "cloud" : "local"
        }}
        actions={() => ({
            onChange: value => {
                const newType = value;
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
        <LoginTypeSelectorView {...props} />
    </AltContainer>
);

export default LoginTypeSelector;
