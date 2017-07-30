import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import BaseModal from "../../Modal/BaseModal";
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

        this.depositCoin      = "rmb";
        this.apiUrl           = "https://bitshares.dacplay.org/transwiser/setting.json";
        this.withdrawChannels = ["alipay", "bank_wire"];
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
                        withdraw_fee: setting.fee.withdraw,
                        withdraw_fee_min: setting.fee.withdraw_min || 0
                    })
            }, error => {
                console.log( "error: ",error  );
            }
        )
        }, error => {
            console.log( "error: ",error  );
        });
    }

    getWithdrawModalId(channel="") {
        return "withdraw" + channel + this.getModalId();
    }

    getDepositModalId() {
        return "deposit" + this.getModalId();
    }

    getModalId() {
        return "_asset_"+this.props.issuerAccount.get('name') + "_"+this.props.receiveAsset.get('symbol');
    }

    onWithdraw(channel="") {
        ZfApi.publish(this.getWithdrawModalId(channel), "open");
    }

    onDeposit() {
        ZfApi.publish(this.getDepositModalId(), "open");
    }

    onModalComplete = (modalId) => {
        ZfApi.publish(modalId, "close");
    }

    render() {
        let loading = (<tr style={{display:"block"}}><td>loading {this.props.receiveAsset && this.props.receiveAsset.get("symbol")}</td><td></td><td></td><td></td></tr>);

        if( !this.props.account || !this.props.issuerAccount || !this.props.receiveAsset )
            return loading;

        if (!this.state.depositUrl) {
            return loading;
        }

        let depositModalId  = this.getDepositModalId();

        let withdrawBtns = this.withdrawChannels.map(channel => {
            let withdrawModalId = this.getWithdrawModalId(channel);
            return <span key={`wc${channel}`}>
                <button className={"button outline"} onClick={this.onWithdraw.bind(this, channel)}> <Translate content={"gateway.transwiser.channel.withdraw."+channel} /> </button>
                <BaseModal id={withdrawModalId} overlay={true}>
                    <br/>
                    <div className="grid-block vertical">
                        <TranswiserWithdrawModal
                            channel={channel}
                            account={this.props.account.get('name')}
                            issuerAccount={this.props.issuerAccount.get('name')}
                            sellAsset={this.props.receiveAsset.get('symbol')}
                            fee={this.state.withdraw_fee}
                            fee_min={this.state.withdraw_fee_min}
                            modalId={withdrawModalId}
                            onModalComplete={this.onModalComplete} />
                    </div>
                </BaseModal>
            </span>
        })

        return <tr>
            <td>{this.props.receiveAsset.get('symbol')} </td>
            <td>
                <button className={"button outline"} onClick={this.onDeposit.bind(this)}> <Translate content="gateway.deposit" /> </button>
                <BaseModal id={depositModalId} overlay={true}>
                    <br/>
                    <div className="grid-block vertical">
                        <TranswiserDepositModal
                            issuerAccount={this.props.issuerAccount.get('name')}
                            depositUrl={this.state.depositUrl}
                            qr={this.state.qr}
                            fee={this.state.deposit_fee}
                            inventoryAsset={this.props.receiveAsset.get('symbol')}
                            modalId={depositModalId}
                            onModalComplete={this.onModalComplete} />
                    </div>
                </BaseModal>
            </td>
            <td> <AccountBalance account={this.props.account.get('name')} asset={this.props.receiveAsset.get('symbol')} /> </td>
            <td>{withdrawBtns}</td>
        </tr>
    }
}

export default BindToChainState(TranswiserDepositWithdraw, {keep_updating: true});
