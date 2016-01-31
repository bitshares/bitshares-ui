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
import WalletDb from "stores/WalletDb";
import AmountSelector from "../../Utility/AmountSelector";
import WithdrawModalBlocktrades from "../../Modal/WithdrawModalBlocktrades";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../../Account/AccountBalance";
import BalanceComponent from "../../Utility/BalanceComponent";
import RefcodeInput from "../../Forms/RefcodeInput";
import ReactTooltip from "react-tooltip"

var Post = require("../../Utility/FormPost.js");

@BindToChainState({keep_updating:true})
class BlockTradesGatewayDepositRequest extends React.Component {
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
        deposit_wallet_type: React.PropTypes.string,
        receive_asset: ChainTypes.ChainAsset,
        deprecated_in_favor_of: ChainTypes.ChainAsset,
        deprecated_message: React.PropTypes.string
    };

    constructor(props) {
        super(props);
        this.state = { receive_address: null };
    }

    requestDepositAddress() {
        let body = JSON.stringify({
            inputCoinType:this.props.deposit_coin_type,
            outputCoinType:this.props.receive_coin_type,
            outputAddress:this.props.account.get('name')
        })
        console.log( "body: ", body );

        fetch( this.props.url + '/simple-api/initiate-trade', {
            method:'post',
            headers: new Headers( { "Accept": "application/json", "Content-Type":"application/json" } ),
            body: body
        }).then( reply => { reply.json().then( json => {
                console.log( "reply: ", json )
                if( json.inputAddress )
                    this.addDepositAddress( json.inputAddress );
                else
                    this.addDepositAddress( "unknown" );
            }, error => {
                console.log( "error: ",error  );
                this.addDepositAddress( "unknown" );
            }
        )
        }, error => {
            console.log( "error: ",error  );
            this.addDepositAddress( "unknown" );
        });

    }

    addDepositAddress( receive_address ) {
        let wallet = WalletDb.getWallet();
        let name = this.props.account.get('name');
        // console.log( "this.props.gateway: ", this.props.gateway );
        // console.log( "this.props.deposit_asset: ", this.props.deposit_asset );
		
        if( !wallet.deposit_keys ) wallet.deposit_keys = {}
        if( !wallet.deposit_keys[this.props.gateway] )
            wallet.deposit_keys[this.props.gateway] = {}
        if( !wallet.deposit_keys[this.props.gateway][this.props.deposit_asset] )
            wallet.deposit_keys[this.props.gateway][this.props.deposit_asset] = {}
        if( !wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][name] )
            wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][name] = [receive_address]
        else
            wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][name].push( receive_address );

        WalletDb._updateWallet();

        this.setState( {receive_address} );
    }

    getWithdrawModalId() {
        // console.log( "this.props.issuer: ", this.props.issuer_account.toJS() )
        // console.log( "this.receive_asset.issuer: ", this.props.receive_asset.toJS() )
        return "withdraw_asset_"+this.props.issuer_account.get('name') + "_"+this.props.receive_asset.get('symbol');
    }

    onWithdraw() {
        ZfApi.publish(this.getWithdrawModalId(), "open");
    }
    
    render() {
        if( !this.props.account || !this.props.issuer_account || !this.props.receive_asset )
            return <tr style={{display:"none"}}><td></td><td></td><td></td><td></td></tr>;

        let wallet = WalletDb.getWallet();
        let account_balances_object = this.props.account.get("balances");

        let balance = "0 " + this.props.receive_asset.get('symbol');
        if (this.props.deprecated_in_favor_of)
        {
            let has_nonzero_balance = false;
            let balance_object_id = account_balances_object.get(this.props.receive_asset.get('id'));
            if (balance_object_id)
            {
                let balance_object = ChainStore.objects_by_id.get(balance_object_id);
                if (balance_object)
                {
                    let balance = balance_object.get('balance');
                    if (balance != 0)
                        has_nonzero_balance = true;
                }
            }
            if (!has_nonzero_balance)
                return <tr style={{display:"none"}}><td></td><td></td><td></td><td></td></tr>;
        }
        
        let account_balances = account_balances_object.toJS();
        let asset_types = Object.keys(account_balances);
        if (asset_types.length > 0) {
            let current_asset_id = this.props.receive_asset.get('id');
            if( current_asset_id )
            {
                balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>);
            }
        }

        let receive_address = this.state.receive_address;
        if( !receive_address )  {
            if( wallet.deposit_keys &&
                wallet.deposit_keys[this.props.gateway] &&
                wallet.deposit_keys[this.props.gateway][this.props.deposit_asset] &&
                wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][this.props.account.get('name')]
            )
            {
                let addresses = wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][this.props.account.get('name')]
                receive_address = addresses[addresses.length-1]
            }
        }
        
        if( !receive_address ) 
            this.requestDepositAddress();

        let withdraw_modal_id = this.getWithdrawModalId();
        let deposit_address_fragment = null;
        if (this.props.deprecated_in_favor_of)
        {
            deposit_address_fragment = <span>please use {this.props.deprecated_in_favor_of.get('symbol')} instead. <span data-tip={this.props.deprecated_message} data-place="right" data-html={true}><Icon name="question-circle" /></span><ReactTooltip /></span>;
        }
        else
        {
            if (this.props.deposit_account)
            {
                deposit_address_fragment = (<span><code>{this.props.deposit_account}</code> with memo <code>{this.props.receive_coin_type + ':' + this.props.account.get('name')}</code></span>);
                var withdraw_memo_prefix = this.props.deposit_coin_type + ':';
            }
            else
            {
                deposit_address_fragment = (<span><code>{receive_address}</code> &nbsp; <button className={"button outline"} onClick={this.requestDepositAddress.bind(this)}><Translate content="gateway.generate" /></button></span>);
                var withdraw_memo_prefix = '';
            }
        }

        return <tr>
            <td>{this.props.deposit_asset} </td>
            <td>{deposit_address_fragment}</td>
            <td> <AccountBalance account={this.props.account.get('name')} asset={this.props.receive_asset.get('symbol')} /> </td>
            <td> <button className={"button outline"} onClick={this.onWithdraw.bind(this)}> <Translate content="gateway.withdraw" /> </button>
                <Modal id={withdraw_modal_id} overlay={true}>
                    <Trigger close={withdraw_modal_id}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
                    <div className="grid-block vertical">
                        <WithdrawModalBlocktrades
                            account={this.props.account.get('name')}
                            issuer={this.props.issuer_account.get('name')}
                            asset={this.props.receive_asset.get('symbol')}
                            url={this.props.url}
                            output_coin_name={this.props.deposit_asset_name}
                            output_coin_symbol={this.props.deposit_asset}
                            output_coin_type={this.props.deposit_coin_type}
                            output_wallet_type={this.props.deposit_wallet_type}
                            memo_prefix={withdraw_memo_prefix}
                            modal_id={withdraw_modal_id} />
                    </div>
                </Modal>
            </td>
        </tr>
    }
}; // BlockTradesGatewayDepositRequest

export default BlockTradesGatewayDepositRequest
