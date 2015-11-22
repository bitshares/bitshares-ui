import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import LoadingIndicator from "../LoadingIndicator";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Statistics from "./Statistics";
import AccountActions from "actions/AccountActions";
import Icon from "../Icon/Icon";
import TimeAgo from "../Utility/TimeAgo";
import HelpContent from "../Utility/HelpContent";
import WalletDb from "stores/WalletDb";
import AmountSelector from "../Utility/AmountSelector";
import WithdrawModal from "../Modal/WithdrawModal";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../Account/AccountBalance";
import BalanceComponent from "../Utility/BalanceComponent";
import RefcodeInput from "../Forms/RefcodeInput";
import WithdrawModalMetaexchange from "../Modal/WithdrawModalMetaexchange";
import DepositModalMetaexchange from "../Modal/DepositModalMetaexchange";
import TranswiserDepositWithdraw from "./transwiser/TranswiserDepositWithdraw";
import BlockTradesBridgeDepositRequest from "./blocktrades/BlockTradesBridgeDepositRequest";
import BlockTradesGatewayDepositRequest from "./blocktrades/BlockTradesGatewayDepositRequest";
import WithdrawModalBlocktrades from "../Modal/WithdrawModalBlocktrades";
var Post = require("../Utility/FormPost.js");

@BindToChainState({keep_updating:true})
class MetaexchangeDepositRequest extends React.Component {
    static propTypes = {
        gateway:           		React.PropTypes.string,
        symbol_pair: 			React.PropTypes.string,
		deposit_asset_name: 	React.PropTypes.string,
        account: 				ChainTypes.ChainAccount,
        issuer_account: 		ChainTypes.ChainAccount,
        deposit_asset: 			React.PropTypes.string,
		is_bts_deposit: 		React.PropTypes.string,
        receive_asset: 			ChainTypes.ChainAsset
    };
	
	constructor(props) 
	{
		let parts = props.symbol_pair.split('_');
		props.base_symbol = parts[0];
		props.quote_symbol = parts[1];
	
        super(props);
        this.state = { deposit_address: null, 
						memo:null, 
						base_symbol:parts[0],
						quote_symbol:parts[1]
					};
		this.apiRoot = "https://metaexchange.info/api";
		this.marketPath = "https://metaexchange.info/markets/";
		//this.apiRoot = "http://localhost:1235/api";
		//this.marketPath = "http://localhost:1235/markets/";
    }

	getDepositAddress()
	{
		Post.PostForm(this.apiRoot + '/1/submitAddress', {
					receiving_address:this.props.account.get('name'), 
					order_type:'buy', 
					symbol_pair:this.props.symbol_pair
				}).then( reply=>reply.json().then(reply=>
				{
					//console.log(reply);
					
					this.setState( {deposit_address:reply.deposit_address, memo:reply.memo} );
					
					let wallet = WalletDb.getWallet();
					let name = this.props.account.get('name');
					
					if( !wallet.deposit_keys ) wallet.deposit_keys = {}
					if( !wallet.deposit_keys[this.props.gateway] )
						wallet.deposit_keys[this.props.gateway] = {}
					if( !wallet.deposit_keys[this.props.gateway][this.state.base_symbol] )
						wallet.deposit_keys[this.props.gateway][this.state.base_symbol] = {}
					else
						wallet.deposit_keys[this.props.gateway][this.state.base_symbol][name] = reply
					
					WalletDb._updateWallet();
				}));
	}

    getWithdrawModalId() {
        return "withdraw" + this.getModalId();
    }
	
	getDepositModalId() {
        return "deposit" + this.getModalId();
    }
	
	getModalId() {
        return "_asset_"+this.props.issuer_account.get('name') + "_"+this.props.receive_asset.get('symbol');
    }

    onWithdraw() {
        ZfApi.publish(this.getWithdrawModalId(), "open");
    }
	
	onDeposit() {
        ZfApi.publish(this.getDepositModalId(), "open");
    }

	getMetaLink()
	{
		let wallet = WalletDb.getWallet();
		var withdrawAddr = "";
		
		try
		{
			withdrawAddr = wallet.deposit_keys[this.props.gateway][this.state.base_symbol]['withdraw_address'];
		}
		catch (Error) {}
		
		return this.marketPath + this.props.symbol_pair.replace('_','/')+'?receiving_address='+encodeURIComponent(this.props.account.get('name')+','+withdrawAddr);
	}

    render() {
        if( !this.props.account || !this.props.issuer_account || !this.props.receive_asset )
            return <tr><td></td><td></td><td></td><td></td></tr>
			
		let wallet = WalletDb.getWallet();
        
        if( !this.state.deposit_address )  
		{
			try
			{
				let reply = wallet.deposit_keys[this.props.gateway][this.state.base_symbol][this.props.account.get('name')];
				this.state.deposit_address = reply.deposit_address;
				this.state.memo = reply.memo;
			}
			catch (Error) {}
        }
        if( !this.state.deposit_address )
		{ 
			this.getDepositAddress(); 
		}
        
        let withdraw_modal_id = this.getWithdrawModalId();
		let deposit_modal_id = this.getDepositModalId();
		
        return <tr>
            <td>{this.props.deposit_asset} </td>


			<td> <button className={"button outline"} onClick={this.onDeposit.bind(this)}> <Translate content="gateway.deposit" /> </button>
                <Modal id={deposit_modal_id} overlay={true}>
                    <Trigger close={deposit_modal_id}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
                    <div className="grid-block vertical">
                        <DepositModalMetaexchange
							api_root={this.apiRoot}
							symbol_pair={this.props.symbol_pair}
							gateway={this.props.gateway}
							deposit_address={this.state.deposit_address}
							memo={this.state.memo}
							is_bts_deposit={this.props.is_bts_deposit}
							receive_asset_name={this.props.deposit_asset_name}
                            receive_asset_symbol={this.props.deposit_asset}
                            modal_id={deposit_modal_id} />
                    </div>
                </Modal>
            </td>
			
			<td><button className={"button outline"}><a target="__blank" href={this.getMetaLink()}>Open in metaexchange</a></button></td>
			
            <td> <AccountBalance account={this.props.account.get('name')} asset={this.state.base_symbol} /> </td>
            <td> <button className={"button outline"} onClick={this.onWithdraw.bind(this)}> <Translate content="gateway.withdraw" /> </button>
                <Modal id={withdraw_modal_id} overlay={true}>
                    <Trigger close={withdraw_modal_id}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
                    <div className="grid-block vertical">
                        <WithdrawModalMetaexchange
							api_root={this.apiRoot}
							gateway={this.props.gateway}
							order_type='sell'
							symbol_pair={this.props.symbol_pair}
                            account={this.props.account.get('name')}
                            issuer={this.props.issuer_account.get('name')}
							is_bts_withdraw={this.props.is_bts_deposit}
                            asset={this.props.receive_asset.get('symbol')}
                            receive_asset_name={this.props.deposit_asset_name}
                            receive_asset_symbol={this.props.deposit_asset}
                            modal_id={withdraw_modal_id} />
                    </div>
                </Modal>
            </td>
        </tr>
    }
}; // MetaexchangeDepositRequest

@BindToChainState({keep_updating:true})
class AccountDepositWithdraw extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
		gprops: ChainTypes.ChainObject.isRequired,
        dprops: ChainTypes.ChainObject.isRequired
    }
    static defaultProps = {
        gprops: "2.0.0",
        dprops: "2.1.0"
    }

    constructor( props ) {
        super(props);
        this.state = {hide_refcode: true};
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.account !== this.props.account || nextProps.qprops !== this.props.qprops || nextProps.dprops !== this.props.dprops || nextState.hide_refcode !== this.state.hide_refcode;
    }

    showRefcodeInput(e) {
        e.preventDefault();
        this.setState({hide_refcode: false});
    }

    render() {
        return (
		<div className="grid-content">
			<div className="content-block">
                <h2><Translate content="gateway.bridge" /></h2>
                <hr/>
				<div className="content-block">
                    <h3><a href="https://blocktrades.us" target="__blank">BlockTrades</a></h3>
                    <BlockTradesBridgeDepositRequest
                        gateway="blocktrades"
                        url="https://api.blocktrades.us/v2"
                        issuer_account="blocktrades"
                        account={this.props.account}
                        initial_deposit_input_coin_type="btc" 
                        initial_deposit_output_coin_type="bts" 
                        initial_deposit_estimated_input_amount="1.0"
                        initial_withdraw_input_coin_type="bts" 
                        initial_withdraw_output_coin_type="btc" 
                        initial_withdraw_estimated_input_amount="100000"
                        />
                </div>
				<div className="content-block">
                    <h3><a href="https://metaexchange.info" target="__blank">metaexchange.info</a></h3>

                    <div>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><Translate content="gateway.symbol" /></th>
                                <th></th>
                                <th><Translate content="gateway.meta.open_website" /></th>
                                <th><Translate content="gateway.balance" /></th>
                                <th><Translate content="gateway.withdraw" /></th>
                            </tr>
                            </thead>
                            <tbody>
								<MetaexchangeDepositRequest
									symbol_pair="BTS_BTC"
									gateway="metaexchange"
									issuer_account="metaexchangebtc"
									account={this.props.account}
									receive_asset="BTS"
									is_bts_deposit="true"
									deposit_asset="BTS"
									deposit_asset_name="Bitcoin"/>
                            </tbody>
                        </table>
                    </div>
                </div>
			</div>
				
            <div className="content-block">
                <h2><Translate content="gateway.gateway" /></h2>
                <hr/>

                <div className="content-block">
                        <h3><a href="http://www.transwiser.com" target="_blank"><Translate content="gateway.transwiser.gateway" /></a></h3>
                    <div>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><Translate content="gateway.symbol" /></th>
                                <th><Translate content="gateway.deposit_to" /></th>
                                <th><Translate content="gateway.balance" /></th>
                                <th><Translate content="gateway.withdraw" /></th>
                            </tr>
                            </thead>
                            <tbody>
                                <TranswiserDepositWithdraw
                                    issuerAccount="transwiser-wallet"
                                    account={this.props.account.get('name')}
                                    receiveAsset="CNY" />
                                <TranswiserDepositWithdraw
                                    issuerAccount="transwiser-wallet"
                                    account={this.props.account.get('name')}
                                    receiveAsset="BOTSCNY" />
                            </tbody>
                        </table>
                    </div>

                </div>


                <div className="content-block">
                    <h3>OpenLedger (CCEDK)</h3>

                    <div>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><Translate content="gateway.symbol" /></th>
                                <th><Translate content="gateway.deposit_to" /></th>
                                <th><Translate content="gateway.balance" /></th>
                                <th><Translate content="gateway.withdraw" /></th>
                            </tr>
                            </thead>
                            <tbody>
                            <BlockTradesGatewayDepositRequest
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                receive_asset="OPENBTC"
                                deposit_asset="BTC"
                                deposit_coin_type="btc"
                                deposit_asset_name="Bitcoin"
                                receive_coin_type="openbtc" />
                            <BlockTradesGatewayDepositRequest
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                receive_asset="OPENLTC"
                                deposit_asset="LTC"
                                deposit_coin_type="ltc"
                                deposit_asset_name="Litecoin"
                                receive_coin_type="openltc" />
                            <BlockTradesGatewayDepositRequest
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                receive_asset="OPENDOGE"
                                deposit_asset="DOGE"
                                deposit_coin_type="doge"
                                deposit_asset_name="Dogecoin"
                                receive_coin_type="opendoge" />
                            <BlockTradesGatewayDepositRequest
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                receive_asset="OPENDASH"
                                deposit_asset="DASH"
                                deposit_coin_type="dash"
                                deposit_asset_name="Dash"
                                receive_coin_type="opendash" />
                            <BlockTradesGatewayDepositRequest 
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account} 
                                receive_asset="OPENPPC"
                                deposit_asset="PPC"
                                deposit_coin_type="peercoin"
                                deposit_asset_name="Peercoin"
                                receive_coin_type="openppc" />
                            <BlockTradesGatewayDepositRequest 
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account} 
                                deposit_asset="MUSE"
                                deposit_asset_name="Muse"
                                deposit_coin_type="muse"
                                deposit_account="openledger-wallet"
                                receive_asset="OPENMUSE"
                                receive_coin_type="openmuse" />
                            <BlockTradesGatewayDepositRequest 
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account} 
                                deposit_asset="NSR"
                                deposit_asset_name="NuShares"
                                deposit_coin_type="nsr"
                                deposit_account="openledger-wallet"
                                receive_asset="OPENNSR"
                                receive_coin_type="opennsr" />
                            <BlockTradesGatewayDepositRequest 
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account} 
                                deposit_asset="NBT"
                                deposit_asset_name="NuBits"
                                deposit_coin_type="nbt"
                                deposit_account="openledger-wallet"
                                receive_asset="OPENNBT"
                                receive_coin_type="opennbt" />
                            </tbody>
                        </table>
                    </div>
                </div>
				<div className="content-block">
                    <h3><a href="https://metaexchange.info" target="__blank">metaexchange.info</a></h3>

                    <div>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><Translate content="gateway.symbol" /></th>
                                <th></th>
                                <th><Translate content="gateway.meta.open_website" /></th>
                                <th><Translate content="gateway.balance" /></th>
                                <th><Translate content="gateway.withdraw" /></th>
                            </tr>
                            </thead>
                            <tbody>
								<MetaexchangeDepositRequest
									symbol_pair="METAEX.BTC_BTC"
									gateway="metaexchange"
									issuer_account="dev-metaexchange.monsterer"
									account={this.props.account}
									receive_asset="METAEX.BTC"
									deposit_asset="BTC"
									deposit_asset_name="Bitcoin"/>
								<MetaexchangeDepositRequest
									symbol_pair="METAEX.ETH_ETH"
									gateway="metaexchange"
									issuer_account="dev-metaexchange.monsterer"
									account={this.props.account}
									receive_asset="METAEX.ETH"
									deposit_asset="ETH"
									deposit_asset_name="Ether"/>
								<MetaexchangeDepositRequest
									symbol_pair="METAEX.NXT_NXT"
									gateway="metaexchange"
									issuer_account="dev-metaexchange.monsterer"
									account={this.props.account}
									receive_asset="METAEX.NXT"
									deposit_asset="NXT"
									deposit_asset_name="Nxt"/>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="content-block">
                    <h3><a href="https://blocktrades.us" target="__blank">BlockTrades</a></h3>

                    <div>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><Translate content="gateway.symbol" /></th>
                                <th><Translate content="gateway.deposit_to" /></th>
                                <th><Translate content="gateway.balance" /></th>
                                <th><Translate content="gateway.withdraw" /></th>
                            </tr>
                            </thead>
                            <tbody>
                            <BlockTradesGatewayDepositRequest
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                receive_asset="TRADE.BTC"
                                deposit_asset="BTC"
                                deposit_coin_type="btc"
                                deposit_asset_name="Bitcoin"
                                receive_coin_type="trade.btc" />
                            <BlockTradesGatewayDepositRequest
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="ltc"
                                deposit_asset_name="Litecoin"
                                deposit_asset="LTC"
                                receive_asset="TRADE.LTC"
                                receive_coin_type="trade.ltc" />
                            <BlockTradesGatewayDepositRequest
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="nsr"
                                deposit_asset_name="NuShares"
                                deposit_asset="NSR"
                                receive_asset="TRADE.NSR"
                                receive_coin_type="trade.nsr" />
                            <BlockTradesGatewayDepositRequest
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="nbt"
                                deposit_asset_name="NuBits"
                                deposit_asset="NBT"
                                receive_asset="TRADE.NBT"
                                receive_coin_type="trade.nbt" />
                            </tbody>
                        </table>
                    </div>


                </div>
                <div className="content-block shrink">
                    {this.state.hide_refcode ?
                        <label className="inline"><a href onClick={this.showRefcodeInput.bind(this)}><Translate content="refcode.claim_refcode"/></a></label>
                        : <RefcodeInput
                        label="refcode.claim_refcode"
                        action_label="refcode.claim"
                        allow_claim_to_account={this.props.account.get('name')} />}
                </div>
            </div>
		</div>
        )
    }
};


export default AccountDepositWithdraw;
