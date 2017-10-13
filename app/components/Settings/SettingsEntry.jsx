import React from "react";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import AssetName from "../Utility/AssetName";
export default class SettingsEntry extends React.Component {

    constructor() {
        super();

        this.state = {
            message: null
        };
    }

    _setMessage(key) {
        this.setState({
            message: counterpart.translate(key)
        });

        this.timer = setTimeout(() => {
            this.setState({message: null});
        }, 4000);
    }

    componentWillUnmount() {
        clearTimeout(this.timer);
    }

    render() {
        let {defaults, setting, settings} = this.props;
        let options, optional, confirmButton, value, input, selected = settings.get(setting);
        let noHeader = false;

        switch (setting) {
            case "locale":
                value = selected;
                options = defaults.map(entry => {
                    let translationKey = "languages." + entry;
                    let value = counterpart.translate(translationKey);

                    return <option key={entry} value={entry}>{value}</option>;
                });

                break;

            case "themes":
                value = selected;
                options = defaults.map(entry => {
                    let translationKey = "settings." + entry;
                    let value = counterpart.translate(translationKey);

                    return <option key={entry} value={entry}>{value}</option>;
                });

                break;

            case "defaultMarkets":
                options = null;
                value = null;
                break;

            case "walletLockTimeout":
                value = selected;
                input = <input type="text" value={selected} onChange={this.props.onChange.bind(this, setting)}/>;
                break;

            case "reset":
                value = true;

                input = <div
                    style={{height: 60, width: "100%", paddingTop: 20}}
                    className="button"
                    onClick={() => {SettingsActions.clearSettings().then(() => {this._setMessage("settings.restore_default_success");});}}
                >
                    {counterpart.translate("settings.reset")}
                </div>;

                noHeader = true;
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
                    options = defaults.map((entry) => {
                        let option = entry.translate ? counterpart.translate(`settings.${entry.translate}`) : entry;
                        if (setting === "unit") {
                            option = <AssetName name={entry} />;
                        }
                        let key = entry.translate ? entry.translate : entry;
                        return <option value={entry.translate ? entry.translate : entry} key={key}>{option}</option>;
                    });
                } else {
                    input = <input type="text" defaultValue={value} onBlur={this.props.onChange.bind(this, setting)}/>;
                }
                break;
        }
        if ((typeof value !== "number" && !value) && !options) return null;

        if (value && value.translate) {
            value = value.translate;
        }

        return (
            <section className="block-list">
                {noHeader ? null : <header><Translate component="span" content={`settings.${setting}`} /></header>}
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

                <div className="facolor-success">{this.state.message}</div>
            </section>
        );
    }
}
