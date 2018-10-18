import React from "react";
import {BackupRestore} from "../Wallet/Backup";
import ImportKeys from "../Wallet/ImportKeys";
import {CreateWalletFromBrainkey} from "../Wallet/WalletCreate";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import SettingsActions from "actions/SettingsActions";
import RestoreFavorites from "./RestoreFavorites";
import {Button, Select} from "bitshares-ui-style-guide";

const Option = Select.Option;

export default class RestoreSettings extends React.Component {
    constructor() {
        super();
        this.state = {
            restoreType: 0,
            types: ["backup", "key", "legacy", "brainkey", "favorites"]
        };
    }

    _setWalletMode() {
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
    }

    _changeType(value) {
        this.setState({
            restoreType: this.state.types.indexOf(value)
        });
    }

    render() {
        let {passwordLogin} = this.props;

        if (passwordLogin) {
            return (
                <div>
                    <Translate
                        content="settings.wallet_required"
                        component="h4"
                    />
                    <p className="dark-text-color">
                        <Translate content="settings.wallet_required_text" />:
                    </p>

                    <Button
                        type="primary"
                        className="button"
                        onClick={this._setWalletMode}
                    >
                        <Translate content="settings.enable_wallet" />
                    </Button>
                </div>
            );
        }
        let {types, restoreType} = this.state;
        let options = types.map(type => {
            return (
                <Option key={type} value={type}>
                    {counterpart.translate(`settings.backup_${type}`)}{" "}
                </Option>
            );
        });

        let content;

        switch (types[restoreType]) {
            case "backup":
                content = (
                    <div>
                        <BackupRestore />
                    </div>
                );
                break;

            case "brainkey":
                content = (
                    <div>
                        <p style={{maxWidth: "40rem", paddingBottom: 10}}>
                            <Translate content="settings.restore_brainkey_text" />
                        </p>
                        <CreateWalletFromBrainkey nested />
                    </div>
                );
                break;

            case "favorites":
                content = (
                    <div>
                        <RestoreFavorites />
                    </div>
                );
                break;

            default:
                content = <ImportKeys privateKey={restoreType === 1} />;
                break;
        }

        return (
            <div>
                <Select
                    onChange={this._changeType.bind(this)}
                    className="bts-select"
                    value={types[restoreType]}
                >
                    {options}
                </Select>

                {content}
            </div>
        );
    }
}
