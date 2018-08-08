import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import BaseModal from "./BaseModal";

export default class BrowserSupportModal extends React.Component {
    show() {
        ZfApi.publish("browser_modal", "open");
    }

    _openLink() {
        let newWnd = window.open(
            "https://www.google.com/chrome/browser/desktop/",
            "_blank"
        );
        newWnd.opener = null;
    }

    render() {
        return (
            <BaseModal id="browser_modal" overlay={true} ref="browser_modal">
                <div className="grid-block vertical no-overflow">
                    <Translate component="h3" content="app_init.browser" />
                    <Translate component="p" content="app_init.browser_text" />
                    <br />

                    <p>
                        <a onClick={this._openLink}>Google Chrome</a>
                    </p>

                    <div
                        className="button-group no-overflow"
                        style={{paddingTop: 0}}
                    >
                        <Trigger close="browser_modal">
                            <div className="button">
                                <Translate content="app_init.understand" />
                            </div>
                        </Trigger>
                    </div>
                </div>
            </BaseModal>
        );
    }
}
