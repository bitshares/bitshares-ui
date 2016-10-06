import React, {PropTypes} from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";

export default class BrowserSupportModal extends React.Component {

    show() {
        ZfApi.publish("browser_modal", "open");
    }

    _openLink() {
        window.open("https://www.google.com/chrome/browser/desktop/", "_blank");
    }
        
    render() {
        return (
            <Modal id="browser_modal" overlay={true} ref="browser_modal">
                <Trigger close="browser_modal">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical no-overflow">
                    <Translate component="h3" content="init_error.browser"/>
                    <Translate component="p" content="init_error.browser_text"/>
                    <br/>

                    <p><a href onClick={this._openLink}>Google Chrome</a></p>

                    <div className="button-group no-overflow" style={{paddingTop: 0}}>
                        <Trigger close="browser_modal">
                            <div onClick={this._openLink} className="button"><Translate content="init_error.understand" /></div>
                        </Trigger>
                    </div>

                </div>
            </Modal>
        );
    }
}
