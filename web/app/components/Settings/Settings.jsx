import React from "react";
import counterpart from "counterpart";
import IntlActions from "actions/IntlActions";
import Translate from "react-translate-component";
import cookies from "cookies-js";
import SettingsActions from "actions/SettingsActions";
import {Link} from "react-router";
import WebsocketAddModal from "./WebsocketAddModal";

class SettingsEntry extends React.Component {

    render() {
        let {defaults, setting, settings} = this.props;
        let options, optional, value, input, selected = settings.get(setting);

        let myLocale = counterpart.getLocale();

        switch (setting) {
            case "locale":
                
                options = defaults.map(function(entry) {
                    var translationKey = "languages." + entry;
                    return <Translate key={entry} value={entry} component="option" content={translationKey} />;
                }).sort((a, b) => {
                    if (a.key === myLocale) {
                        return -1;
                    }
                    if (b.key === myLocale) {
                        return 1;
                    }
                    if (b.key < a.key) {
                        return 1;
                    } else if (b.key > a.key) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
                break;

            case "defaultMarkets":
                options = null;
                value = null;
                break;

            case "connection":
                value = selected;
                options = defaults.map(entry => {
                    let option = entry.translate ? counterpart.translate(`settings.${entry.translate}`) : entry;
                    let key = entry.translate ? entry.translate : entry;
                    return <option key={key}>{option}</option>;
                });

                optional = (
                    <div style={{position: "absolute", right: 0, top: "0.2rem"}}>
                        <div onClick={this.props.triggerModal} id="remove" className="button outline" data-tip="Remove connection string" data-type="light">-</div>
                        <div onClick={this.props.triggerModal} id="add" className="button outline" data-tip="Add connection string" data-type="light">+</div>
                    </div>);

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
                    options = defaults.map(entry => {
                        let option = entry.translate ? counterpart.translate(`settings.${entry.translate}`) : entry;
                        let key = entry.translate ? entry.translate : entry;
                        return <option key={key}>{option}</option>;
                    });
                } else {
                    input = <input type="text" defaultValue={value} onBlur={this.props.onChange.bind(this, setting)}/>
                }
                break;

        }

        if (!value && !options) return null;

        if (value && value.translate) {
            value = counterpart.translate(`settings.${value.translate}`);
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
                    </li>
                </ul> : null}
                {input ? <ul><li>{input}</li></ul> : null}
            </section>
        );
    }
}


class Settings extends React.Component {

    triggerModal(e) {
        this.refs.ws_modal.show(e);
    }

    _onChangeSetting(setting, e) {
        e.preventDefault();

        let {defaults} = this.props;
        let value = null;

        function findEntry(targetValue, targetDefaults) {
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
                    cookies.set("graphene_locale", e.target.value, { expires: Infinity });
                    SettingsActions.changeSetting({setting: "locale", value: e.target.value });
                }
                break;

            case "defaultMarkets": 
                break;

            case "inverseMarket":
            case "confirmMarketOrder":
                value = findEntry(e.target.value, defaults) === 0; // USD/CORE is true, CORE/USD is false
                break;

            case "connection":
                SettingsActions.changeSetting({setting: "connection", value: e.target.value });
                break;

            default:
                value = findEntry(e.target.value, defaults);
                break;
        }

        if (value !== null) {
            SettingsActions.changeSetting({setting: setting, value: value });
        }

    }

    render() {
        let {settings, defaults} = this.props;
        return (
            <div className="grid-block page-layout">
                <div className="grid-block medium-6 main-content">
                    <div className="grid-content no-overflow">
                        {settings.map((value, setting) => {
                            return (
                                <SettingsEntry 
                                    key={setting}
                                    setting={setting}
                                    settings={settings}
                                    defaults={defaults[setting]}
                                    onChange={this._onChangeSetting}
                                    locales={this.props.localesObject}
                                    triggerModal={this.triggerModal.bind(this)}
                                />);                   
                        }).toArray()}
                    </div>
                </div>
                <div className="grid-block medium-6 right-column">
                    <div className="grid-content">
                        <div><label><h5><Link to="wallet"><Translate content="settings.wallets" /></Link></h5></label></div>
                    </div>
                </div>
                <WebsocketAddModal ref="ws_modal" apis={defaults["connection"]} />
            </div>
        );
    }
}

export default Settings;

