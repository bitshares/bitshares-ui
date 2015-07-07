import React from "react";
import counterpart from "counterpart";
import IntlActions from "actions/IntlActions";
import Translate from "react-translate-component";
import cookies from "cookies-js";
import SettingsActions from "actions/SettingsActions";
import {Link} from "react-router";

class Settings extends React.Component {

    _onChangeLanguage(e) {
        e.preventDefault();
        let myLocale = counterpart.getLocale();
        if (e.target.value !== myLocale) {
            IntlActions.switchLocale(e.target.value);
            cookies.set("graphene_locale", e.target.value, { expires: Infinity });
            SettingsActions.changeSetting({setting: "locale", value: e.target.value });
        }
    }

    _onChangeSetting(setting, e) {
        e.preventDefault();
        let {currencies, orientation} = this.props.defaults;
        let value = null;
        switch (setting) {
            case "inverseMarket":
                value = orientation.indexOf(e.target.value) === 0; // USD/CORE is true, CORE/USD is false
                break;

            case "unit":
                value = currencies.indexOf(e.target.value);
                break;

            default:
                break;
        }

        if (value !== null) {
            SettingsActions.changeSetting({setting: setting, value: value });
        }

    }

    render() {
        let {settings} = this.props;
        let {currencies, locales, orientation} = this.props.defaults;
        let myLocale = counterpart.getLocale();

        var options = locales.map(function(locale) {
            var translationKey = "languages." + locale;
            return <Translate key={locale} value={locale} component="option" content={translationKey} />;
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


        let unitOptions = currencies.map((unit, index) => {
            return <option key={index}>{unit}</option>;
        });

        let selectedOrientation = settings.get("inverseMarket") ? 0 : 1;

        return (
            <div className="grid-block page-layout">
                <div className="grid-block medium-3 left-column">
                    <div className="grid-content">
                    </div>
                </div>
                <div className="grid-block medium-6 main-content">
                    <div className="grid-content no-overflow">
                        <section className="block-list">
                            <header><Translate component="span" content="languages.switch" />:</header>
                                <ul>
                                    <li className="with-dropdown">
                                    <select onChange={this._onChangeLanguage}>
                                        {options}
                                    </select>
                                    </li>
                                </ul>
                        </section>
                        <section className="block-list">
                            <header><Translate component="span" content="settings.inversed" />:</header>
                                <ul>
                                    <li className="with-dropdown">
                                    <select value={orientation[selectedOrientation]} onChange={this._onChangeSetting.bind(this, "inverseMarket")}>
                                        <option>{orientation[0]}</option>
                                        <option>{orientation[1]}</option>
                                    </select>
                                    </li>
                                </ul>
                        </section>
                        <section className="block-list">
                            <header><Translate component="span" content="settings.unit" />:</header>
                                <ul>
                                    <li className="with-dropdown">
                                    <select value={currencies[settings.get("unit")]} onChange={this._onChangeSetting.bind(this, "unit")}>
                                        {unitOptions}
                                    </select>
                                    </li>
                                </ul>
                        </section>
                    </div>
                </div>
                <div className="grid-block medium-3 right-column">
                    <div className="grid-content">
                        <Link to="console">Open js console</Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default Settings;
