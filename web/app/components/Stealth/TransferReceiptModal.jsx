import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import Icon from "../Icon/Icon";

class TransferReceiptModal extends React.Component {

    static propTypes = {
        value: React.PropTypes.string
    };

    constructor(props) {
        super(props);
        this._selectAndCopy = this._selectAndCopy.bind(this);
        this._copyToClipboard = this._copyToClipboard.bind(this);
    }

    _selectAndCopy() {
        const t_receipt = document.getElementById("t_receipt");
        t_receipt.focus();
        t_receipt.select();
    }

    _selectElementText(el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    _copyToClipboard(e) {
        e.preventDefault();
        this._selectElementText(this.refs.t_receipt);
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
    }

    render() {
        return (<Modal id="transfer_receipt_modal" overlay>
            <Trigger close="transfer_receipt_modal">
                <a href="#" className="close-button">&times;</a>
            </Trigger>
            <h3>Transfer Receipt</h3>
            <a href className="float-right" onClick={this._copyToClipboard} data-tip="Copy to Clipboard" data-type="light"><Icon name="clipboard-copy"/></a>
            <div style={{paddingTop: "1rem"}}>
                <div className="form-group">
                    <textarea ref="t_receipt" id="t_receipt" rows="4" cols="50" value={this.props.value} autoFocus readOnly onClick={this._selectAndCopy} />
                </div>
                <div className="button-group">
                    <Trigger close="transfer_receipt_modal"><a href className="button">Close</a></Trigger>
                </div>
            </div>
        </Modal>);
    }

}

export default TransferReceiptModal;
