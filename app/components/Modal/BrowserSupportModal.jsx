import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import {getWalletName} from "branding";
import counterpart from "counterpart";
import {Modal, Button} from "bitshares-ui-style-guide";

export default class BrowserSupportModal extends React.Component {
    _openLink() {
        let newWnd = window.open(
            "https://www.google.com/chrome/browser/desktop/",
            "_blank"
        );
        newWnd.opener = null;
    }

    render() {
        return (
            <Modal
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                title={counterpart.translate("app_init.browser")}
                footer={[
                    <Button
                        key={"submit"}
                        type="primary"
                        onClick={this.props.hideModal}
                    >
                        {counterpart.translate("app_init.understand")}
                    </Button>
                ]}
            >
                <div className="grid-block vertical no-overflow">
                    <Translate
                        component="p"
                        content="app_init.browser_text"
                        wallet_name={getWalletName()}
                    />
                    <br />

                    <p>
                        <a onClick={this._openLink}>Google Chrome</a>
                    </p>
                </div>
            </Modal>
        );
    }
}
