import React from "react";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";
import {Button, Notification} from "bitshares-ui-style-guide";

class RestoreFavorites extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            json: null,
            error: null
        };
    }

    upload(evt) {
        this.setState({error: false, json: null});

        let file = evt.target.files[0];
        let reader = new FileReader();
        reader.onload = evt => {
            let contents = evt.target.result;

            try {
                let json = JSON.parse(contents);

                for (var key in json) {
                    let market = json[key];
                    let {quote, base} = market;

                    if (!quote || !base)
                        throw new Error("Cannot parse json data.");
                }

                this.setState({json});
                // this.finish();
            } catch (message) {
                this.setState({error: true});
            }
        };
        reader.readAsText(file);
    }

    finish() {
        const {json} = this.state;

        SettingsActions.clearStarredMarkets();

        for (var key in json) {
            let market = json[key];
            let {quote, base} = market;

            SettingsActions.addStarMarket(quote, base);
        }

        Notification.success({
            message: counterpart("settings.backup_favorites_success")
        });
    }

    render() {
        const {state} = this;

        return (
            <div>
                <input
                    type="file"
                    id="file_input"
                    accept=".json"
                    style={{
                        border: "solid",
                        marginBottom: 15
                    }}
                    onChange={this.upload.bind(this)}
                />

                {state.error && (
                    <h5>
                        <Translate content="settings.backup_favorites_error" />
                    </h5>
                )}

                {state.json && (
                    <p>
                        <Button
                            type={"primary"}
                            onClick={this.finish.bind(this)}
                        >
                            <Translate content="settings.backup_favorites_finish" />
                        </Button>
                    </p>
                )}
            </div>
        );
    }
}

export default RestoreFavorites;
