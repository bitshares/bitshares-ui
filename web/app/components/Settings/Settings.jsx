import React from "react";
import counterpart from "counterpart";
import IntlActions from "actions/IntlActions";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import {Link} from "react-router";
import WebsocketAddModal from "./WebsocketAddModal";

class SettingsEntry extends React.Component {

    _onConfirm() {
        SettingsActions.changeSetting({setting: "connection", value: this.props.connection });
        setTimeout(this._onReloadClick, 250);
    }

    _onReloadClick() {
        if (window.electron) {
            window.location.hash = "";
            window.remote.getCurrentWindow().reload();
        }
        else window.location.href = "/";
    }

    render() {
        let {defaults, setting, settings, connection} = this.props;
        let options, optional, confirmButton, value, input, selected = settings.get(setting);

        let myLocale = counterpart.getLocale();

        switch (setting) {
            case "locale":
                value = selected;
                options = defaults.map(entry => {
                    let translationKey = "languages." + entry;
                    let value = counterpart.translate(translationKey);

                    return <option key={entry} value={entry}>{value}</option>;
                })

                break;

            case "themes":
                value = selected;
                options = defaults.map(entry => {
                    let translationKey = "settings." + entry;
                    let value = counterpart.translate(translationKey);

                    return <option key={entry} value={entry}>{value}</option>;
                })

                break;

            case "defaultMarkets":
                options = null;
                value = null;
                break;

            case "connection":
                value = defaults.indexOf(connection) !== -1 ? connection : defaults[0];
                options = defaults.map(entry => {
                    let option = entry.translate ? counterpart.translate(`settings.${entry.translate}`) : entry;
                    let key = entry.translate ? entry.translate : entry;
                    return <option value={option} key={key}>{option}</option>;
                });

                let defaultConnection = defaults[0];

                let confirmButton = <div style={{padding: "10px"}}><button onClick={this._onConfirm.bind(this)} className="button outline"><Translate content="transfer.confirm" /></button></div>

                optional = (
                    <div style={{position: "absolute", right: 0, top: "0.2rem"}}>
                        {value !== defaultConnection ? <div onClick={this.props.triggerModal} id="remove" className="button outline" data-tip="Remove connection string" data-type="light">-</div> : null}
                        <div onClick={this.props.triggerModal} id="add" className="button outline" data-tip="Add connection string" data-type="light">+</div>
                    </div>);

                break;

            case "walletLockTimeout":
                value = selected;
                input = <input type="text" value={selected} onChange={this.props.onChange.bind(this, setting)}/>
                break;

            case "faucet_address":
                if (!selected) {
                    value = "https://";
                } else {
                    value = selected;
                }
                input = <input type="text" defaultValue={value} onChange={this.props.onChange.bind(this, setting)}/>
                break;

            default:

                if (typeof selected === "number") {
                    value = defaults[selected];
                }
                else if(typeof selected === "boolean") {
                    if (selected) {
                        value = defaults[0];
                    } else {
                        value = defaults[1];
                    }
                }
                else if(typeof selected === "string") {
                    value = selected;
                }


                if (defaults) {
                    options = defaults.map((entry, index) => {
                        let option = entry.translate ? counterpart.translate(`settings.${entry.translate}`) : entry;

                        let key = entry.translate ? entry.translate : entry;
                        return <option value={entry.translate ? entry.translate : entry} key={key}>{option}</option>;
                    })
                } else {
                    input = <input type="text" defaultValue={value} onBlur={this.props.onChange.bind(this, setting)}/>
                }
                break;

        }



        if (!value && !options) return null;

        if (value && value.translate) {
            value = value.translate;
        }

        return (
            <section className="block-list">
                <header><Translate component="span" content={`settings.${setting}`} /></header>
                {options ? <ul>
                    <li className="with-dropdown">
                        {optional}
                        <select value={value} onChange={this.props.onChange.bind(this, setting)}>
                            {options}
                        </select>
                        {confirmButton}
                    </li>
                </ul> : null}
                {input ? <ul><li>{input}</li></ul> : null}
            </section>
        );
    }
}


class Settings extends React.Component {

    constructor(props) {
        super();

        this.state = {
            connection: props.settings.get("connection")
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

    render() {
        let {settings, defaults} = this.props;

        return (
            <div className="grid-block page-layout">
                <div className="grid-block main-content">
                    <div className="grid-container">
                        <div className="button-group" style={{paddingTop: 20}}>
                            <Link to="wallet">
                                <div className="button">
                                    <Translate content="wallet.console" />
                                </div>
                            </Link>
                            <br />
                            <div onClick={this.onReset} className="button">
                                    <Translate content="settings.reset" />
                            </div>
                        </div>

                        {settings.map((value, setting) => {
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
                        }).toArray()}
                        
                    </div>
                </div>
                <WebsocketAddModal
                    ref="ws_modal"
                    apis={defaults["connection"]}
                    api={defaults["connection"].filter(a => {return a === this.state.connection})}
                    changeConnection={(connection) => {this.setState({connection})}}
                />
            </div>
        );
    }
}

export default Settings;

