import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import WalletDb from "stores/WalletDb";
import LoadingIndicator from "../LoadingIndicator";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import counterpart from "counterpart"
import notify from "actions/NotificationActions"

let ControlButtons = ({loading, value, onReceiveClick}) => {
    if (value === "success") {
        return <div className="button-group">
            <Trigger close="receive_funds_modal"><a href className="button">Close</a></Trigger>
        </div>;
    } else {
        return loading ? <LoadingIndicator type="circle"/> :
            <div className="button-group">
                <a className={"button" + (value ? "" : " disabled")} href onClick={onReceiveClick}>Receive</a>
                <Trigger close="receive_funds_modal"><a href className="secondary button">Cancel</a></Trigger>
            </div>;
    }
};

class ReceiveFundsModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {value: "", loading: false, error: null};
        this._onReceiveClick = this._onReceiveClick.bind(this);
        ZfApi.subscribe("receive_funds_modal", (name, msg) => {
            if (msg === "open") this.setState({value: ""});
        });
    }

    _onReceiveClick() {
        console.log("-- ReceiveFundsModal._onReceiveClick -->", this.state.value);
        const cwallet = WalletDb.getState().cwallet;
        cwallet.receiveBlindTransfer(this.state.value.trim()).then(res => {
            console.log("-- receiveBlindTransfer res -->", res);
            this.setState({loading: false, value: "success"});
        }).catch(error => {
            console.log("-- receiveBlindTransfer error -->", error);
            this.setState({loading: false, error: error});
            if(/missing key/.test(error.toString()))
                notify.error(counterpart.translate("wallet.missing_private_for_receipt"));
        });
        this.setState({loading: true});
    }

    render() {
        const {value, loading} = this.state;
        return (<Modal id="receive_funds_modal" overlay>
            <Trigger close="receive_funds_modal">
                <a href="#" className="close-button">&times;</a>
            </Trigger>
            <h3>Receive Funds</h3>
            <form style={{paddingTop: "1rem"}}>
                <div className="form-group">
                    {value === "success" ? "Your request was processed successfully" : <textarea rows="5" cols="50" placeholder="Transfer Receipt.." onChange={e => this.setState({value: e.target.value})} value={value} />}
                </div>
                <ControlButtons value={value} loading={loading} onReceiveClick={this._onReceiveClick}/>
            </form>
        </Modal>);
    }

}

export default ReceiveFundsModal;
