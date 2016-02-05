import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";

class ReceiveFundsModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {value: ""};
        this._onReceiveClick = this._onReceiveClick.bind(this);
    }

    _onReceiveClick() {
        console.log("-- ReceiveFundsModal._onReceiveClick -->");
    }

    render() {
        return (<Modal id="receive_funds_modal" overlay>
            <Trigger close="receive_funds_modal">
                <a href="#" className="close-button">&times;</a>
            </Trigger>
            <h3>Receive Funds</h3>
            <form style={{paddingTop: "1rem"}}>
                <div className="form-group">
                    <textarea rows="4" cols="50" placeholder="Transfer Receipt.." onChange={e => this.setState({value: e.target.value})} />
                </div>
                <div className="button-group">
                    <a className={"button" + (this.state.value ? "" : " disabled")} href onClick={this._onReceiveClick}>Receive</a>
                    <Trigger close="receive_funds_modal"><a href className="secondary button">Cancel</a></Trigger>
                </div>
            </form>
        </Modal>);
    }

}

export default ReceiveFundsModal;
