import React from "react";
import counterpart from "counterpart";
import IntlActions from "actions/IntlActions";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import {Link} from "react-router";
import WebsocketAddModal from "./WebsocketAddModal";
import SettingsEntry from "./SettingsEntry";
import AccountsSettings from "./AccountsSettings";
import WalletSettings from "./WalletSettings";
import PasswordSettings from "./PasswordSettings";
import RestoreSettings from "./RestoreSettings";
import BackupSettings from "./BackupSettings";


class Settings extends React.Component {

    constructor(props) {
        super();

        this.state = {
            connection: props.settings.get("connection"),
            activeSetting: props.viewSettings.get("activeSetting", 0),
            menuEntries: [
                "general",
                "wallet",
                "accounts",
                "password",
                "backup",
                "restore",
                "access"
            ],
            settingEntries: {
                general: ["locale", "unit", "showSettles", "walletLockTimeout", "themes",
                "disableChat"],
                access: ["connection", "faucet_address"]
            }
        };
    }

    triggerModal(e) {
        this.refs.ws_modal.show(e);
    }

    _onChangeSetting(setting, e) {
        e.preventDefault();

        let {defaults} = this.props;
        let value = null;

        function findEntry(targetValue, targetDefaults) {
            if (!targetDefaults) return targetValue;
            if (targetDefaults[0].translate) {
                for (var i = 0; i < targetDefaults.length; i++) {
                    if (counterpart.translate(`settings.${targetDefaults[i].translate}`) === targetValue) {
                        return i;
                    }
                }
            } else {
                return targetDefaults.indexOf(targetValue);
            }
        }

        switch (setting) {
        case "locale":
            let myLocale = counterpart.getLocale();
            if (e.target.value !== myLocale) {
                IntlActions.switchLocale(e.target.value);
                SettingsActions.changeSetting({setting: "locale", value: e.target.value });
            }
            break;

        case "themes":
            SettingsActions.changeSetting({setting: "themes", value: e.target.value });
            break;

        case "defaultMarkets":
            break;

        case "walletLockTimeout":
            let newValue = parseInt(e.target.value, 10);
            if (newValue && !isNaN(newValue) && typeof newValue === "number") {
                SettingsActions.changeSetting({setting: "walletLockTimeout", value: e.target.value });
            }
            break;

        case "inverseMarket":
        case "confirmMarketOrder":
            value = findEntry(e.target.value, defaults[setting]) === 0; // USD/BTS is true, BTS/USD is false
            break;

        case "connection":
            // SettingsActions.changeSetting({setting: "connection", value: e.target.value });
            this.setState({
                connection: e.target.value
            });
            break;

        case "disableChat":
            SettingsActions.changeSetting({setting: "disableChat", value: e.target.value === "yes" });
            break;

        case "showSettles":
            SettingsActions.changeSetting({setting: "showSettles", value: e.target.value === "yes" });
            break;

        case "unit":
            let index = findEntry(e.target.value, defaults[setting]);
            SettingsActions.changeSetting({setting: setting, value: defaults[setting][index]});
            break;

        default:
            value = findEntry(e.target.value, defaults[setting]);
            break;
        }

        if (value !== null) {
            SettingsActions.changeSetting({setting: setting, value: value });
        }

    }

    onReset() {
        SettingsActions.clearSettings();
    }

    _onChangeMenu(entry) {
        let index = this.state.menuEntries.indexOf(entry);
        this.setState({
            activeSetting: index
        });

        SettingsActions.changeViewSetting({activeSetting: index});
    }

    render() {
        let {settings, defaults} = this.props;
        let {menuEntries, activeSetting, settingEntries} = this.state;

        let entries;
        let activeEntry = menuEntries[activeSetting];
        switch (activeEntry) {

        case "accounts":
            entries = <AccountsSettings />;
            break;

        case "wallet":
            entries = <WalletSettings />;
            break;

        case "password":
            entries = <PasswordSettings />;
            break;

        case "backup":
            entries = <BackupSettings />;
            break;

        case "restore":
            entries = <RestoreSettings />;
            break;

        default:
            entries = settingEntries[activeEntry].map(setting => {
                return (
                    <SettingsEntry
                        key={setting}
                        setting={setting}
                        settings={settings}
                        defaults={defaults[setting]}
                        onChange={this._onChangeSetting.bind(this)}
                        locales={this.props.localesObject}
                        triggerModal={this.triggerModal.bind(this)}
                        {...this.state}
                    />);
            });
            break;
        }

        return (
            <div className="grid-block page-layout">
                <div className="grid-block main-content" style={{marginTop: "1rem"}}>
                    <div className="grid-content medium-offset-2 shrink" style={{paddingRight: "4rem"}}>
                        <Translate style={{paddingBottom: 20}} className="bottom-border" component="h4" content="header.settings" />

                        <ul className="settings-menu">
                            {menuEntries.map((entry, index) => {
                                return <li className={index === activeSetting ? "active" : ""} onClick={this._onChangeMenu.bind(this, entry)} key={entry}><Translate content={"settings." + entry} /></li>;
                            })}
                        </ul>
                    </div>

                    <div className="grid-content">
                        <div className="grid-block small-10 no-padding no-margin vertical">
                            <Translate component="h3" content={"settings." + menuEntries[activeSetting]} />
                            <Translate style={{paddingTop: 10, paddingBottom: 20, marginBottom: 30}} className="bottom-border" content={`settings.${menuEntries[activeSetting]}_text`} />
                            {entries}
                        </div>
                    </div>
                </div>
                <WebsocketAddModal
                    ref="ws_modal"
                    apis={defaults["connection"]}
                    api={defaults["connection"].filter(a => {return a === this.state.connection;})}
                    changeConnection={(connection) => {this.setState({connection});}}
                />
            </div>
        );
    }
}

export default Settings;
