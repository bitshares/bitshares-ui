import React from "react";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import AssetName from "../Utility/AssetName";
import Notify from "notifyjs";
export default class SettingsEntry extends React.Component {
    constructor() {
        super();

        this.state = {
            message: null
        };

        this.handleNotificationChange = this.handleNotificationChange.bind(
            this
        );
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

    handleNotificationChange(path) {
        return evt => {
            this.props.onNotificationChange(path, !!evt.target.checked);
        };
    }

    render() {
        let {defaults, setting, settings} = this.props;
        let options,
            optional,
            confirmButton,
            value,
            input,
            selected = settings.get(setting);
        let noHeader = false;
        let component = null;

        switch (setting) {
            case "locale":
                value = selected;
                options = defaults.map(entry => {
                    let translationKey = "languages." + entry;
                    let value = counterpart.translate(translationKey);

                    return (
                        <option key={entry} value={entry}>
                            {value}
                        </option>
                    );
                });

                break;

            case "themes":
                value = selected;
                options = defaults.map(entry => {
                    let translationKey = "settings." + entry;
                    let value = counterpart.translate(translationKey);

                    return (
                        <option key={entry} value={entry}>
                            {value}
                        </option>
                    );
                });

                break;

            case "browser_notifications":
                value = selected;

                component = (
                    <div className="settings--notifications">
                        <div className="settings--notifications--group">
                            <div className="settings--notifications--item">
                                <input
                                    type="checkbox"
                                    id="browser_notifications.allow"
                                    checked={!!value.allow}
                                    onChange={this.handleNotificationChange(
                                        "allow"
                                    )}
                                />
                                <label htmlFor="browser_notifications.allow">
                                    {counterpart.translate(
                                        "settings.browser_notifications_allow"
                                    )}
                                </label>
                            </div>
                            <div className="settings--notifications--group">
                                <div className="settings--notifications--item">
                                    <input
                                        type="checkbox"
                                        id="browser_notifications.additional.transferToMe"
                                        disabled={!value.allow}
                                        checked={
                                            !!value.additional.transferToMe
                                        }
                                        onChange={this.handleNotificationChange(
                                            "additional.transferToMe"
                                        )}
                                    />
                                    <label htmlFor="browser_notifications.allow">
                                        {counterpart.translate(
                                            "settings.browser_notifications_additional_transfer_to_me"
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>
                        {!!value.allow &&
                            Notify.needsPermission && (
                                <a
                                    href="https://goo.gl/zZ7NHY"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Translate
                                        component="div"
                                        className="settings--notifications--no-browser-support"
                                        content="settings.browser_notifications_disabled_by_browser_notify"
                                    />
                                </a>
                            )}
                    </div>
                );

                break;

            case "defaultMarkets":
                options = null;
                value = null;
                break;

            case "walletLockTimeout":
                value = selected;
                input = (
                    <input
                        type="text"
                        className="settings-input"
                        value={selected}
                        onChange={this.props.onChange.bind(this, setting)}
                    />
                );
                break;

            default:
                if (typeof selected === "number") {
                    value = defaults[selected];
                } else if (typeof selected === "boolean") {
                    if (selected) {
                        value = defaults[0];
                    } else {
                        value = defaults[1];
                    }
                } else if (typeof selected === "string") {
                    value = selected;
                }

                if (defaults) {
                    options = defaults.map(entry => {
                        let option = entry.translate
                            ? counterpart.translate(
                                  `settings.${entry.translate}`
                              )
                            : entry;
                        if (setting === "unit") {
                            option = <AssetName name={entry} />;
                        }
                        let key = entry.translate ? entry.translate : entry;
                        return (
                            <option
                                value={
                                    entry.translate ? entry.translate : entry
                                }
                                key={key}
                            >
                                {option}
                            </option>
                        );
                    });
                } else {
                    input = (
                        <input
                            className="settings-input"
                            type="text"
                            defaultValue={value}
                            onBlur={this.props.onChange.bind(this, setting)}
                        />
                    );
                }
                break;
        }
        if (typeof value !== "number" && !value && !options) return null;

        if (value && value.translate) {
            value = value.translate;
        }

        return (
            <section className="block-list no-border-bottom">
                {noHeader ? null : (
                    <header>
                        <Translate
                            component="span"
                            style={{
                                fontWeight: "normal",
                                fontFamily: "Roboto-Medium, arial, sans-serif",
                                fontStyle: "normal"
                            }}
                            content={`settings.${setting}`}
                        />
                    </header>
                )}
                {options ? (
                    <ul>
                        <li className="with-dropdown">
                            {optional}
                            <select
                                value={value}
                                className="settings-select"
                                onChange={this.props.onChange.bind(
                                    this,
                                    setting
                                )}
                            >
                                {options}
                            </select>
                            {confirmButton}
                        </li>
                    </ul>
                ) : null}
                {input ? (
                    <ul>
                        <li>{input}</li>
                    </ul>
                ) : null}

                {component ? component : null}

                <div className="facolor-success">{this.state.message}</div>
            </section>
        );
    }
}
