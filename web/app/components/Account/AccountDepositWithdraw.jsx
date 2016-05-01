import config from "chain/config";
import React from "react";
import {Link} from "react-router";
import connectToStores from "alt/utils/connectToStores";
import accountUtils from "common/account_utils";
import utils from "common/utils";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import WalletDb from "stores/WalletDb";
import MetaexchangeDepositRequest from "../DepositWithdraw/metaexchange/MetaexchangeDepositRequest";
import TranswiserDepositWithdraw from "../DepositWithdraw/transwiser/TranswiserDepositWithdraw";
import BlockTradesBridgeDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesBridgeDepositRequest";
import BlockTradesGatewayDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesGatewayDepositRequest";
import OpenLedgerFiatDepositWithdrawal from "../DepositWithdraw/openledger/OpenLedgerFiatDepositWithdrawal";
import OpenLedgerFiatTransactionHistory from "../DepositWithdraw/openledger/OpenLedgerFiatTransactionHistory";
import Tabs from "../Utility/Tabs";
import HelpContent from "../Utility/HelpContent";
import Post from "common/formPost";

@BindToChainState({keep_updating:true})
class AccountDepositWithdraw extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        contained: React.PropTypes.bool
    };

    static defaultProps = {
        contained: false
    };

    constructor() {
        super();
        this.state = {
            blockTradesCoins: []
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        console.log("nextProps.account !== this.props.account:", nextProps.account !== this.props.account);
        console.log("blockTradesCoins, this.state.blockTradesCoins:", !utils.are_equal_shallow(nextState.blockTradesCoins, this.state.blockTradesCoins));
        return (
            nextProps.account !== this.props.account ||
            !utils.are_equal_shallow(nextState.blockTradesCoins, this.state.blockTradesCoins)
        );
    }

    componentWillMount() {
        accountUtils.getFinalFeeAsset(this.props.account, "transfer");
        fetch("https://blocktrades.us/api/v2/coins").then(reply => reply.json().then(result => {
            console.log("result:", result);
            this.setState({
                blockTradesCoins: result
            });
        })).catch(err => {
            console.log("error fetching blocktrades list of coins", err);
        });
    }

    render() {

        return (
		<div className={this.props.contained ? "grid-content" : "grid-container"}>
            <div className={this.props.contained ? "" : "grid-content"}>
                <HelpContent path="components/DepositWithdraw" section="receive" account={this.props.account.get("name")}/>
                <HelpContent path="components/DepositWithdraw" section="deposit-short"/>
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
                                    <th><Translate content="gateway.generate" /></th>
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

                    <Tabs.Tab title="Openledger">
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
                                    <th><Translate content="gateway.generate" /></th>
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
                                    key="ccedk-open.dgd"
                                    gateway="openledger"
                                    url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                    issuer_account="openledger-wallet"
                                    account={this.props.account}
                                    deposit_asset="DGD"
                                    deposit_coin_type="dgd"
                                    deposit_asset_name="Digix DGD"
                                    deposit_wallet_type="ethereum"
                                    receive_asset="OPEN.DGD"
                                    receive_coin_type="open.dgd" />
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
                                <BlockTradesGatewayDepositRequest
                                    key="ccedk-open.steem"
                                    gateway="openledger"
                                    url="https://bitshares.openledger.info/depositwithdraw/api/v2"
                                    issuer_account="openledger-wallet"
                                    account={this.props.account}
                                    deposit_asset="STEEM"
                                    deposit_asset_name="Steem"
                                    deposit_coin_type="steem"
                                    deposit_account="openledger"
                                    deposit_wallet_type="steem"
                                    receive_asset="OPEN.STEEM"
                                    receive_coin_type="open.steem"
                                    deposit_memo_name="memo" />
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

@connectToStores
export default class DepositStoreWrapper extends React.Component {
    static getStores() {
        return [AccountStore]
    };

    static getPropsFromStores() {
        return {
            account: AccountStore.getState().currentAccount
        }
    };

    render () {
        return <AccountDepositWithdraw {...this.props}/>
    }
}
