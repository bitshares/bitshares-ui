import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../../Account/AccountBalance";
import TranswiserDepositModal from "./TranswiserDepositModal";
import TranswiserWithdrawModal from "./TranswiserWithdrawModal";

class TranswiserDepositWithdraw extends React.Component {

    static propTypes = {
        issuerAccount:      ChainTypes.ChainAccount.isRequired,
        account:            ChainTypes.ChainAccount.isRequired,
        receiveAsset:       ChainTypes.ChainAsset.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = { depositUrl: null, qr: null, deposit_fee:null, withdraw_fee:null };

        this.depositCoin = "rmb";
        this.apiUrl      = "https://bitshares.dacplay.org/transwiser/setting.json";
        // this.apiUrl      = "http://www.transwiser.com/setting.json";
        // this.apiUrl      = "http://localhost:3000/setting-dev.json";
    }

    componentDidMount() {
        this.requestDepositUrl();
    }

    requestDepositUrl(){
        console.log("props:", this.props);
        let pair = this.depositCoin.toLocaleLowerCase() + ":" + this.props.receiveAsset.get('symbol').toLocaleLowerCase();

        fetch( this.apiUrl, {
            method:'get',
            headers: new Headers( { "Accept": "application/json", "Content-Type":"application/json" } )
        }).then( reply => { reply.json().then( json => {
                // console.log( "reply: ", json )
                let setting = json[pair];
                if( setting )
                    this.setState({
                        depositUrl: setting.depositURL,
                        qr: setting.qr,
                        deposit_fee: setting.fee.deposit,
                        withdraw_fee: setting.fee.withdraw
                    })
            }, error => {
                console.log( "error: ",error  );
            }
        )
        }, error => {
            console.log( "error: ",error  );
        });
    }

    getWithdrawModalId() {
        return "withdraw" + this.getModalId();
    }

    getDepositModalId() {
        return "deposit" + this.getModalId();
    }

    getModalId() {
        return "_asset_"+this.props.issuerAccount.get('name') + "_"+this.props.receiveAsset.get('symbol');
    }

    onWithdraw() {
        // console.log('onWithdraw', this.getWithdrawModalId());
        ZfApi.publish(this.getWithdrawModalId(), "open");
    }

    onDeposit() {
        ZfApi.publish(this.getDepositModalId(), "open");
    }

    render() {
        let loading = (<tr style={{display:"block"}}><td>loading {this.props.receiveAsset && this.props.receiveAsset.get("symbol")}</td><td></td><td></td><td></td></tr>);

        if( !this.props.account || !this.props.issuerAccount || !this.props.receiveAsset )
            return loading;

        if (!this.state.depositUrl) {
            return loading;
        }

        let withdrawModalId = this.getWithdrawModalId();
        let depositModalId  = this.getDepositModalId();

        return <tr>
            <td>{this.props.receiveAsset.get('symbol')} </td>
            <td>
                <button className={"button outline"} onClick={this.onDeposit.bind(this)}> <Translate content="gateway.deposit" /> </button>
                <Modal id={depositModalId} overlay={true}>
                    <Trigger close={depositModalId}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
                    <div className="grid-block vertical">
                        <TranswiserDepositModal
                            issuerAccount={this.props.issuerAccount.get('name')}
                            depositUrl={this.state.depositUrl}
                            qr={this.state.qr}
                            fee={this.state.deposit_fee}
                            inventoryAsset={this.props.receiveAsset.get('symbol')}
                            modalId={depositModalId} />
                    </div>
                </Modal>
            </td>
            <td> <AccountBalance account={this.props.account.get('name')} asset={this.props.receiveAsset.get('symbol')} /> </td>
            <td>
                <button className={"button outline"} onClick={this.onWithdraw.bind(this)}> <Translate content="gateway.withdraw" /> </button>
                <Modal id={withdrawModalId} overlay={true}>
                    <Trigger close={withdrawModalId}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
                    <div className="grid-block vertical">
                        <TranswiserWithdrawModal
                            account={this.props.account.get('name')}
                            issuerAccount={this.props.issuerAccount.get('name')}
                            sellAsset={this.props.receiveAsset.get('symbol')}
                            fee={this.state.withdraw_fee}
                            modalId={withdrawModalId} />
                    </div>
                </Modal>
            </td>
        </tr>
    }
}

export default BindToChainState(TranswiserDepositWithdraw, {keep_updating: true});
