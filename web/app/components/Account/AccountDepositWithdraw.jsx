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
import BlockTradesGateway from "../DepositWithdraw/BlockTradesGateway";
import OpenLedgerFiatDepositWithdrawal from "../DepositWithdraw/openledger/OpenLedgerFiatDepositWithdrawal";
import OpenLedgerFiatTransactionHistory from "../DepositWithdraw/openledger/OpenLedgerFiatTransactionHistory";
import Tabs from "../Utility/Tabs";
import HelpContent from "../Utility/HelpContent";
import Post from "common/formPost";
let olGatewayCoins = require("components/DepositWithdraw/openledger/gatewayCoins.json");

@BindToChainState()
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
        return (
            nextProps.account !== this.props.account ||
            !utils.are_equal_shallow(nextState.blockTradesCoins, this.state.blockTradesCoins)
        );
    }

    componentWillMount() {
        accountUtils.getFinalFeeAsset(this.props.account, "transfer");
        fetch("https://blocktrades.us/api/v2/coins").then(reply => reply.json().then(result => {
            this.setState({
                blockTradesCoins: result
            });
        })).catch(err => {
            console.log("error fetching blocktrades list of coins", err);
        });
    }

    render() {
        let blockTradesGatewayCoins = this.state.blockTradesCoins.filter(coin => {
            if (coin.backingCoinType === "muse") {
                return false;
            }
            
            return coin.symbol.toUpperCase().indexOf("TRADE") !== -1;
        })
        .map(coin => {
            return coin;
        });

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

                            {blockTradesGatewayCoins.length ? 
                            <BlockTradesGateway
                                account={this.props.account}
                                coins={blockTradesGatewayCoins}
                                provider="blocktrades"
                            /> : null}

                        </div>
                    </Tabs.Tab>

                    <Tabs.Tab title="Openledger">
                        <div className="content-block">
                            <h3><Translate content="gateway.gateway" /></h3>

                            {blockTradesGatewayCoins.length ? 
                            <BlockTradesGateway
                                account={this.props.account}
                                coins={olGatewayCoins}
                                provider="openledger"
                            /> : null}

                        </div>

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
