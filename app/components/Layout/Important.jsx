import React from "react";
import Translate from "react-translate-component";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import {connect} from "alt-react";

class Important extends React.Component {
    hideImportantMessage(id, e) {
        e.preventDefault();
        SettingsActions.hideImportantMessage(id);
    }

    render() {
        const {hiddenImportantMessages} = this.props;

        if (
            hiddenImportantMessages &&
            hiddenImportantMessages.includes("user_identification_process")
        ) {
            return <div />;
        }

        return (
            <div id="important">
                <div
                    className="dismiss"
                    onClick={this.hideImportantMessage.bind(
                        this,
                        "user_identification_process"
                    )}
                >
                    &times;
                </div>
                <strong>
                    <Translate content="cryptobridge.important.title" />
                    {": "}
                </strong>
                <Translate
                    content="cryptobridge.important.user_verification"
                    unsafe
                />
            </div>
        );
    }
}

export default connect(Important, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        const {hiddenImportantMessages} = SettingsStore.getState();

        return {
            hiddenImportantMessages
        };
    }
});
