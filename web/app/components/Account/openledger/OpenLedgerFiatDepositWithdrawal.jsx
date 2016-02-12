import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";
import LoadingIndicator from "../../LoadingIndicator";
import { ChainStore } from "@graphene/chain";
import ChainTypes from "../../Utility/ChainTypes";
import BindToChainState from "../../Utility/BindToChainState";
import Statistics from "../Statistics";
import AccountActions from "actions/AccountActions";
import Icon from "../../Icon/Icon";
import TimeAgo from "../../Utility/TimeAgo";
import HelpContent from "../../Utility/HelpContent";
// import WalletDb from "stores/WalletDb";
import WithdrawModal from "../../Modal/WithdrawModal";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../../Account/AccountBalance";
import BalanceComponent from "../../Utility/BalanceComponent";
import RefcodeInput from "../../Forms/RefcodeInput";
import DepositFiatOpenLedger from "../../Modal/DepositFiatOpenLedger";
import WithdrawFiatOpenLedger from "../../Modal/WithdrawFiatOpenLedger";
var Post = require("../../Utility/FormPost.js");

@BindToChainState({keep_updating:true})
class OpenLedgerFiatDepositWithdrawCurrency extends React.Component {
    static propTypes = {
        url:               React.PropTypes.string,
        gateway:           React.PropTypes.string,
        deposit_coin_type: React.PropTypes.string,
        deposit_asset_name: React.PropTypes.string,
        deposit_account: React.PropTypes.string,
        receive_coin_type: React.PropTypes.string,
        account: ChainTypes.ChainAccount,
        issuer_account: ChainTypes.ChainAccount,
        deposit_asset: React.PropTypes.string,
        receive_asset: ChainTypes.ChainAsset,
        deposit_allowed: React.PropTypes.bool,
        withdraw_allowed: React.PropTypes.bool
    };

    constructor(props) {
        super(props);
        this.state = { };
    }

    getWithdrawModalId() {
        return "withdraw_fiat_openledger_"+this.props.receive_asset.get('symbol');
    }

    getDepositModalId() {
        return "deposit_fiat_openledger_"+this.props.receive_asset.get('symbol');
    }

    onWithdraw() {
        ZfApi.publish(this.getWithdrawModalId(), "open");
    }
    
    onDeposit() {
        ZfApi.publish(this.getDepositModalId(), "open");
    }

    render() {
        if( !this.props.account || !this.props.issuer_account || !this.props.receive_asset )
            return <tr style={{display:"none"}}><td></td><td></td><td></td><td></td></tr>;

        let account_balances_object = this.props.account.get("balances");

        let balance = "0 " + this.props.receive_asset.get('symbol');
        
        let account_balances = account_balances_object.toJS();
        let asset_types = Object.keys(account_balances);
        if (asset_types.length > 0) {
            let current_asset_id = this.props.receive_asset.get('id');
            if( current_asset_id )
                balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>);
        }

        let deposit_modal_id = this.getDepositModalId();
        let withdraw_modal_id = this.getWithdrawModalId();

        let deposit_fragment = null;
        if (this.props.deposit_allowed)
        {
            deposit_fragment = 
                            <td>
                                <button className={"button outline"} onClick={this.onDeposit.bind(this)}> <Translate content="gateway.deposit" /> </button>
                                <Modal id={deposit_modal_id} overlay={true}>
                                    <Trigger close={deposit_modal_id}>
                                        <a href="#" className="close-button">&times;</a>
                                    </Trigger>
                                    <br/>
                                    <div className="grid-block vertical">
                                        <DepositFiatOpenLedger
                                            account={this.props.account.get('name')}
                                            issuer_account={this.props.issuer_account.get('name')}
                                            receive_asset={this.props.receive_asset.get('symbol')}
                                            rpc_url={this.props.rpc_url}
                                            deposit_asset={this.props.deposit_asset}
                                            modal_id={deposit_modal_id} />
                                    </div>
                                </Modal>
                            </td>;
        }
        else
            deposit_fragment = <td>Click <a href="https://openledger.info/v/" target="_blank">here</a> to register for deposits</td>;

        let withdraw_fragment = null;
        if (this.props.withdraw_allowed)
        {
            withdraw_fragment = 
                            <td>
                                <button className={"button outline"} onClick={this.onWithdraw.bind(this)}> <Translate content="gateway.withdraw" /> </button>
                                <Modal id={withdraw_modal_id} overlay={true}>
                                    <Trigger close={withdraw_modal_id}>
                                        <a href="#" className="close-button">&times;</a>
                                    </Trigger>
                                    <br/>
                                    <div className="grid-block vertical">
                                        <WithdrawFiatOpenLedger
                                            account={this.props.account.get('name')}
                                            issuer_account={this.props.issuer_account.get('name')}
                                            receive_asset={this.props.receive_asset.get('symbol')}
                                            rpc_url={this.props.rpc_url}
                                            deposit_asset={this.props.deposit_asset}
                                            modal_id={withdraw_modal_id} />
                                    </div>
                                </Modal>
                            </td>;
        }
        else
            withdraw_fragment = <td>Click <a href="https://openledger.info/v/">here</a> to register for withdrawals</td>;

        return  <tr>
                    <td>{ this.props.deposit_asset}</td>
                    { deposit_fragment }
                    <td><AccountBalance account={this.props.account.get('name')} asset={this.props.receive_asset.get('symbol')} /></td>
                    { withdraw_fragment }
                </tr>;
    }
}; // OpenLedgerFiatDepositWithdrawCurrency

@BindToChainState({keep_updating:true})
class OpenLedgerFiatDepositWithdrawal extends React.Component {
    static propTypes = {
        rpc_url:           React.PropTypes.string,
        account: ChainTypes.ChainAccount,
        issuer_account: ChainTypes.ChainAccount,
    };

    constructor(props) {
        super(props);

        this.state =
        {
            allowedFiatCurrencies : {
                "deposit": [],
                "withdraw": []
            }
        };

        // get approval status from openledger
        let json_rpc_request = { "jsonrpc": "2.0", "id": 1, "method": "isValidatedForFiat", "params": {"bitsharesAccountName": this.props.account.get('name')}};
        let is_validated_promise = fetch(this.props.rpc_url,
                                                {method: 'POST', 
                                                 headers: new Headers({"Accept": "application/json", 
                                                 "content-type":"application/x-www-form-urlencoded"}), 
                                                 body: 'rq=' + encodeURIComponent(JSON.stringify(json_rpc_request)) })
                                 .then(response => response.json());
        
        is_validated_promise.then((json_response) => {
            if ('result' in json_response)
                this.setState( { allowedFiatCurrencies : json_response.result } );
        })
        .catch((error) => {
            this.setState( {
                allowedFiatCurrencies : {
                    "deposit": [],
                    "withdraw": []
                }
            });
        })
    }


    componentWillUnmount()
    {
        clearInterval(this.update_timer);
    }
    
    render() {
        if (!this.props.account || !this.props.issuer_account)
            return  <div></div>;

        return      <table className="table">
                        <thead>
                        <tr>
                            <th><Translate content="gateway.symbol" /></th>
                            <th><Translate content="gateway.deposit_to" /></th>
                            <th><Translate content="gateway.balance" /></th>
                            <th><Translate content="gateway.withdraw" /></th>
                        </tr>
                        </thead>
                        <tbody>
                            <OpenLedgerFiatDepositWithdrawCurrency 
                                rpc_url={this.props.rpc_url}
                                account={this.props.account}
                                issuer_account={this.props.issuer_account}
                                deposit_asset="USD"
                                receive_asset="OPEN.USD" 
                                deposit_allowed={this.state.allowedFiatCurrencies.deposit.indexOf("USD") > -1} 
                                withdraw_allowed={this.state.allowedFiatCurrencies.withdraw.indexOf("USD") > -1}/>
                            <OpenLedgerFiatDepositWithdrawCurrency 
                                rpc_url={this.props.rpc_url}
                                account={this.props.account}
                                issuer_account={this.props.issuer_account}
                                deposit_asset="EUR"
                                receive_asset="OPEN.EUR" 
                                deposit_allowed={this.state.allowedFiatCurrencies.deposit.indexOf("EUR") > -1} 
                                withdraw_allowed={this.state.allowedFiatCurrencies.withdraw.indexOf("EUR") > -1}/>
                            <OpenLedgerFiatDepositWithdrawCurrency 
                                rpc_url={this.props.rpc_url}
                                account={this.props.account}
                                issuer_account={this.props.issuer_account}
                                deposit_asset="CNY"
                                receive_asset="OPEN.CNY" 
                                deposit_allowed={this.state.allowedFiatCurrencies.deposit.indexOf("CNY") > -1} 
                                withdraw_allowed={this.state.allowedFiatCurrencies.withdraw.indexOf("CNY") > -1}/>
                        </tbody>
                    </table>;
    }
}; // OpenLedgerFiatDepositWithdrawal

export default OpenLedgerFiatDepositWithdrawal;
