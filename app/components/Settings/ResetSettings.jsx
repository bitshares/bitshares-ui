import React from "react";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";

export default class ResetSettings extends React.Component {
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
        return (
            <section className="block-list no-border-bottom">
                <header>
                    <Translate
                        component="span"
                        style={{
                            fontWeight: "normal",
                            fontFamily: "Roboto-Medium, arial, sans-serif",
                            fontStyle: "normal"
                        }}
                        content={"settings.reset_text_description"}
                        generalName={counterpart.translate("settings.general")}
                        with={{
                            generalName: counterpart.translate(
                                "settings.general"
                            ),
                            accessName: counterpart.translate(
                                "settings.access"
                            ),
                            faucetName: counterpart.translate(
                                "settings.faucet_address"
                            )
                        }}
                    />
                </header>

                <div
                    style={{height: 60, width: "100%", paddingTop: 20}}
                    className="button"
                    onClick={() => {
                        SettingsActions.clearSettings().then(() => {
                            this._setMessage(
                                "settings.restore_default_success"
                            );
                        });
                    }}
                >
                    {counterpart.translate("settings.reset")}
                </div>

                <div
                    className="facolor-success"
                    style={{marginTop: "20px", height: "18px"}}
                >
                    {this.state.message}
                </div>
            </section>
        );
    }
}
