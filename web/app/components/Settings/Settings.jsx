import React from "react";
import counterpart from "counterpart";
import IntlActions from "actions/IntlActions";
import Translate from "react-translate-component";
import cookies from "cookies-js";

class Settings extends React.Component {

    _onChangeLanguage(e) {
        e.preventDefault();
        let myLocale = counterpart.getLocale();
        if (e.target.value !== myLocale) {
            IntlActions.switchLocale(e.target.value);
            cookies.set("graphene_locale", e.target.value, { expires: Infinity });
        }
    }

    render() {
        let locales = ["en", "fr"];
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

        return (
            <div className="grid-block">
                <div className="grid-block small-offset-3 small-6">
                    <div className="grid-content">
                        <div className="grid-block"></div>
                        <section className="block-list">
                            <header><Translate component="span" content="languages.switch" />:</header>
                                <ul>
                                    <li className="with-dropdown">
                                    <select style={{lineHeight: "1.2em"}} onChange={this._onChangeLanguage}>
                                        {options}
                                    </select>
                                    </li>
                                </ul>
                        </section>
                    </div>
                </div>
            </div>
        );
    }
}

export default Settings;
