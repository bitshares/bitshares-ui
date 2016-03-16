import { chain_config } from "@graphene/chain";
import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import { ChainStore } from "@graphene/chain";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import WalletDb from "stores/WalletDb";
import WithdrawModal from "../Modal/WithdrawModal";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../Account/AccountBalance";
import WithdrawModalMetaexchange from "../Modal/WithdrawModalMetaexchange";
import DepositModalMetaexchange from "../Modal/DepositModalMetaexchange";
import TranswiserDepositWithdraw from "./transwiser/TranswiserDepositWithdraw";
import BlockTradesBridgeDepositRequest from "./blocktrades/BlockTradesBridgeDepositRequest";
import BlockTradesGatewayDepositRequest from "./blocktrades/BlockTradesGatewayDepositRequest";
import WithdrawModalBlocktrades from "../Modal/WithdrawModalBlocktrades";
import OpenLedgerFiatDepositWithdrawal from "./openledger/OpenLedgerFiatDepositWithdrawal";
import OpenLedgerFiatTransactionHistory from "./openledger/OpenLedgerFiatTransactionHistory";
import Tabs from "../Utility/Tabs";
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
        super(props);

		let parts = props.symbol_pair.split('_');

        this.state = {
            deposit_address: null,
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

					let name = this.props.account.get('name');
                    
					let deposit_keys = WalletDb.deposit_keys()
                        .updateIn([this.props.gateway, this.state.base_symbol, name], ()=> reply);
					
					// if( !deposit_keys[this.props.gateway] )
					// 	deposit_keys[this.props.gateway] = {}
					// if( !deposit_keys[this.props.gateway][this.state.base_symbol] )
					// 	deposit_keys[this.props.gateway][this.state.base_symbol] = {}
					// else
					// 	deposit_keys[this.props.gateway][this.state.base_symbol][name] = reply
                    
					let data = WalletDb.data().set("deposit_keys", deposit_keys);
					WalletDb.update(data);

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
		var withdrawAddr = WalletDb.deposit_keys()
            .getIn([this.props.gateway, this.state.base_symbol, 'withdraw_address'], "");
		
		return this.marketPath + this.props.symbol_pair.replace('_','/')+'?receiving_address='+encodeURIComponent(this.props.account.get('name')+','+withdrawAddr);
	}

    render() {
        if( !this.props.account || !this.props.issuer_account || !this.props.receive_asset )
            return <tr><td></td><td></td><td></td><td></td></tr>;

        if( !this.state.deposit_address )
		{
			let reply = WalletDb.deposit_keys()
                .getIn([this.props.gateway, this.state.base_symbol, this.props.account.get('name')]);
            
            //  wallet.deposit_keys[this.props.gateway][this.state.base_symbol][this.props.account.get('name')];
            if( reply ) {
				this.state.deposit_address = reply.deposit_address;
				this.state.memo = reply.memo;
            }
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

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.account !== this.props.account ||
            nextProps.qprops !== this.props.qprops ||
            nextProps.dprops !== this.props.dprops
        );
    }

    render() {
        let openledger_deprecated_message =
            "OpenLedger is replacing the original assets like OPENBTC with " +
            "namespaced-asset names like OPEN.BTC in order to protect against " +
            "look-alike asset names.  You can still withdraw the original " +
            "assets or trade them on the market, but OpenLedger will only be " +
            "issuing the new namespaced assets in the future, and we urge " +
            "everyone to transition when convenient";

        return (
		<div className="grid-content">
            <div>
			<Tabs
                setting="depositWithdrawSettingsTab"
                tabsClass="bordered-header no-padding"
                defaultActiveTab={config.depositWithdrawDefaultActiveTab}
                contentClass="grid-content"
            >
                <Tabs.Tab title="BlockTrades">
                    <div className="content-block">
                        <div className="float-right"><a href="https://blocktrades.us" target="__blank">VISIT WEBSITE</a></div>
                        <h3><Translate content="gateway.bridge" /></h3>
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
                        <h3><Translate content="gateway.gateway" /></h3>
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
                                key="blocktrades-trade-btc"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                receive_asset="TRADE.BTC"
                                deposit_asset="BTC"
                                deposit_coin_type="btc"
                                deposit_asset_name="Bitcoin"
                                deposit_wallet_type="bitcoin"
                                receive_coin_type="trade.btc" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-ltc"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="ltc"
                                deposit_asset_name="Litecoin"
                                deposit_asset="LTC"
                                deposit_wallet_type="litecoin"
                                receive_asset="TRADE.LTC"
                                receive_coin_type="trade.ltc" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-doge"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="doge"
                                deposit_asset_name="Dogecoin"
                                deposit_asset="DOGE"
                                deposit_wallet_type="dogecoin"
                                receive_asset="TRADE.DOGE"
                                receive_coin_type="trade.doge" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-nsr"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="nsr"
                                deposit_asset_name="NuShares"
                                deposit_asset="NSR"
                                deposit_wallet_type="nushares"
                                receive_asset="TRADE.NSR"
                                receive_coin_type="trade.nsr" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-nbt"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="nbt"
                                deposit_asset_name="NuBits"
                                deposit_asset="NBT"
                                deposit_wallet_type="nubits"
                                receive_asset="TRADE.NBT"
                                receive_coin_type="trade.nbt" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-dash"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="dash"
                                deposit_asset_name="Dash"
                                deposit_asset="DASH"
                                deposit_wallet_type="dash"
                                receive_asset="TRADE.DASH"
                                receive_coin_type="trade.dash" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-ppc"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="ppc"
                                deposit_asset_name="Peercoin"
                                deposit_asset="PPC"
                                deposit_wallet_type="peercoin"
                                receive_asset="TRADE.PPC"
                                receive_coin_type="trade.ppc" />
                            </tbody>
                        </table>
                    </div>
                </Tabs.Tab>

                <Tabs.Tab title="CCEDK">
                    <div className="content-block">
                        <h3>Fiat</h3>
                        <div className="float-right"><a href="https://www.ccedk.com/" target="__blank">VISIT WEBSITE</a></div>
                        <OpenLedgerFiatDepositWithdrawal
                                rpc_url="https://openledger.info/api/"
                                account={this.props.account}
                                issuer_account="openledger-fiat" />
                        <OpenLedgerFiatTransactionHistory
                                rpc_url="https://openledger.info/api/"
                                account={this.props.account} />
                    </div>
                    <div className="content-block">
                        <h3><Translate content="gateway.gateway" /></h3>
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
                                key="ccedk-open.bks"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="BKS"
                                deposit_asset_name="BlockShares"
                                deposit_coin_type="bks"
                                deposit_wallet_type="blockshares"
                                receive_asset="OPEN.BKS"
                                receive_coin_type="open.bks" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-openbtc"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="BTC"
                                deposit_coin_type="btc"
                                deposit_asset_name="Bitcoin"
                                deposit_wallet_type="bitcoin"
                                receive_asset="OPENBTC"
                                receive_coin_type="openbtc"
                                deprecated_in_favor_of="OPEN.BTC"
                                deprecated_message={openledger_deprecated_message} />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.btc"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="BTC"
                                deposit_coin_type="btc"
                                deposit_asset_name="Bitcoin"
                                deposit_wallet_type="bitcoin"
                                receive_asset="OPEN.BTC"
                                receive_coin_type="open.btc" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-opendash"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="DASH"
                                deposit_coin_type="dash"
                                deposit_asset_name="Dash"
                                deposit_wallet_type="dash"
                                receive_asset="OPENDASH"
                                receive_coin_type="opendash"
                                deprecated_in_favor_of="OPEN.DASH"
                                deprecated_message={openledger_deprecated_message} />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.dash"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="DASH"
                                deposit_coin_type="dash"
                                deposit_asset_name="Dash"
                                deposit_wallet_type="dash"
                                receive_asset="OPEN.DASH"
                                receive_coin_type="open.dash" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-opendoge"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="DOGE"
                                deposit_coin_type="doge"
                                deposit_asset_name="Dogecoin"
                                deposit_wallet_type="dogecoin"
                                receive_asset="OPENDOGE"
                                receive_coin_type="opendoge"
                                deprecated_in_favor_of="OPEN.DOGE"
                                deprecated_message={openledger_deprecated_message} />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.doge"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="DOGE"
                                deposit_coin_type="doge"
                                deposit_asset_name="Dogecoin"
                                deposit_wallet_type="dogecoin"
                                receive_asset="OPEN.DOGE"
                                receive_coin_type="open.doge" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.egd"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="EGD"
                                deposit_asset_name="E-Gold"
                                deposit_coin_type="egd"
                                deposit_wallet_type="egold"
                                receive_asset="OPEN.EGD"
                                receive_coin_type="open.egd" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.emc"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="EMC"
                                deposit_asset_name="EmerCoin"
                                deposit_coin_type="emc"
                                deposit_wallet_type="emercoin"
                                receive_asset="OPEN.EMC"
                                receive_coin_type="open.emc" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.eth"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="ETH"
                                deposit_asset_name="Ether"
                                deposit_coin_type="eth"
                                deposit_wallet_type="ethereum"
                                receive_asset="OPEN.ETH"
                                receive_coin_type="open.eth" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-openltc"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="LTC"
                                deposit_coin_type="ltc"
                                deposit_asset_name="Litecoin"
                                deposit_wallet_type="litecoin"
                                receive_asset="OPENLTC"
                                receive_coin_type="openltc"
                                deprecated_in_favor_of="OPEN.LTC"
                                deprecated_message={openledger_deprecated_message} />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.ltc"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="LTC"
                                deposit_coin_type="ltc"
                                deposit_asset_name="Litecoin"
                                deposit_wallet_type="litecoin"
                                receive_asset="OPEN.LTC"
                                receive_coin_type="open.ltc" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-openmuse"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="MUSE"
                                deposit_asset_name="Muse"
                                deposit_coin_type="muse"
                                deposit_account="openledger-wallet"
                                deposit_wallet_type="muse"
                                receive_asset="OPENMUSE"
                                receive_coin_type="openmuse"
                                deprecated_in_favor_of="OPEN.MUSE"
                                deprecated_message={openledger_deprecated_message}
                                deposit_memo_name="memo" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.muse"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="MUSE"
                                deposit_asset_name="Muse"
                                deposit_coin_type="muse"
                                deposit_account="openledger-wallet"
                                deposit_wallet_type="muse"
                                receive_asset="OPEN.MUSE"
                                receive_coin_type="open.muse"
                                deposit_memo_name="memo" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-opennbt"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="NBT"
                                deposit_asset_name="NuBits"
                                deposit_coin_type="nbt"
                                receive_asset="OPENNBT"
                                deposit_wallet_type="nubits"
                                receive_coin_type="opennbt"
                                deprecated_in_favor_of="OPEN.NBT"
                                deprecated_message={openledger_deprecated_message} />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.nbt"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="NBT"
                                deposit_asset_name="NuBits"
                                deposit_coin_type="nbt"
                                deposit_wallet_type="nubits"
                                receive_asset="OPEN.NBT"
                                receive_coin_type="open.nbt" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-opennsr"
                                gateway="openledger"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="NSR"
                                deposit_asset_name="NuShares"
                                deposit_coin_type="nsr"
                                deposit_wallet_type="nushares"
                                receive_asset="OPENNSR"
                                receive_coin_type="opennsr"
                                deprecated_in_favor_of="OPEN.NSR"
                                deprecated_message={openledger_deprecated_message} />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.nsr"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="NSR"
                                deposit_asset_name="NuShares"
                                deposit_coin_type="nsr"
                                deposit_wallet_type="nushares"
                                receive_asset="OPEN.NSR"
                                receive_coin_type="open.nsr" />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-openppc"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="PPC"
                                deposit_coin_type="peercoin"
                                deposit_asset_name="Peercoin"
                                deposit_wallet_type="peercoin"
                                receive_asset="OPENPPC"
                                receive_coin_type="openppc"
                                deprecated_in_favor_of="OPEN.PPC"
                                deprecated_message={openledger_deprecated_message} />
                            <BlockTradesGatewayDepositRequest
                                key="ccedk-open.ppc"
                                gateway="openledger"
                                url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                issuer_account="openledger-wallet"
                                account={this.props.account}
                                deposit_asset="PPC"
                                deposit_coin_type="peercoin"
                                deposit_asset_name="Peercoin"
                                deposit_wallet_type="peercoin"
                                receive_asset="OPEN.PPC"
                                receive_coin_type="open.ppc" />
                            </tbody>
                        </table>
                    </div>
                </Tabs.Tab>

                <Tabs.Tab title="metaexchange">
                    <div className="content-block">
                        <div className="float-right"><a href="https://metaexchange.info" target="__blank">VISIT WEBSITE</a></div>
                        <h3><Translate content="gateway.bridge" /></h3>
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
                    <div className="content-block">
                        <h3><Translate content="gateway.gateway" /></h3>
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
                </Tabs.Tab>

                <Tabs.Tab title="transwiser">
                    <div className="float-right"><a href="http://www.transwiser.com" target="_blank">VISIT WEBSITE</a></div>
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
                            receiveAsset="TCNY" />
                        <TranswiserDepositWithdraw
                            issuerAccount="transwiser-wallet"
                            account={this.props.account.get('name')}
                            receiveAsset="CNY" />
                        {/*
                        <TranswiserDepositWithdraw
                            issuerAccount="transwiser-wallet"
                            account={this.props.account.get('name')}
                            receiveAsset="BOTSCNY" />
                        */}
                        </tbody>
                    </table>
                </Tabs.Tab>

            </Tabs>
            </div>
		</div>
        )
    }
};


export default AccountDepositWithdraw;
