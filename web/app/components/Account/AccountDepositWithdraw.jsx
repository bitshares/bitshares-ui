import React from "react";
import {Link} from "react-router";
import connectToStores from "alt/utils/connectToStores";
import accountUtils from "common/account_utils";
import utils from "common/utils";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import WalletDb from "stores/WalletDb";
import TranswiserDepositWithdraw from "../DepositWithdraw/transwiser/TranswiserDepositWithdraw";
import BlockTradesBridgeDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesBridgeDepositRequest";
import BlockTradesGatewayDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesGatewayDepositRequest";
import BlockTradesGateway from "../DepositWithdraw/BlockTradesGateway";
import MetaExchange from "../DepositWithdraw/MetaExchange";
import OpenLedgerFiatDepositWithdrawal from "../DepositWithdraw/openledger/OpenLedgerFiatDepositWithdrawal";
import OpenLedgerFiatTransactionHistory from "../DepositWithdraw/openledger/OpenLedgerFiatTransactionHistory";
import Tabs from "../Utility/Tabs";
import HelpContent from "../Utility/HelpContent";
import Post from "common/formPost";
import cnames from "classnames";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";

@BindToChainState()
class AccountDepositWithdraw extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        contained: React.PropTypes.bool
    };

    static defaultProps = {
        contained: false
    };

    constructor(props) {
        super();
        this.state = {
            blockTradesCoins: [],
            blockTradesBackedCoins: [],
            openLedgerCoins: [],
            openLedgerBackedCoins: [],
            olService: props.viewSettings.get("olService", "gateway"),
            btService: props.viewSettings.get("btService", "bridge"),
            metaService: props.viewSettings.get("metaService", "bridge"),
            activeService: props.viewSettings.get("activeService", 0),
            services: ["Openledger (OPEN.X)", "BlockTrades (TRADE.X)", "Transwiser", "MetaExchange"]
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.account !== this.props.account ||
            !utils.are_equal_shallow(nextState.blockTradesCoins, this.state.blockTradesCoins) ||
            !utils.are_equal_shallow(nextState.blockTradesBackedCoins, this.state.blockTradesBackedCoins) ||
            !utils.are_equal_shallow(nextState.openLedgerCoins, this.state.openLedgerCoins) ||
            !utils.are_equal_shallow(nextState.openLedgerBackedCoins, this.state.openLedgerBackedCoins) ||
            nextState.olService !== this.state.olService ||
            nextState.btService !== this.state.btService ||
            nextState.metaService !== this.state.metaService ||
            nextState.activeService !== this.state.activeService
        );
    }

    componentWillMount() {
        accountUtils.getFinalFeeAsset(this.props.account, "transfer");
		
        fetch("https://blocktrades.us/api/v2/coins").then(reply => reply.json().then(result => {
            this.setState({
                blockTradesCoins: result
            });
            this.setState({
                blockTradesBackedCoins: this.getBlocktradesBackedCoins(result)
            });
        })).catch(err => {
            console.log("error fetching blocktrades list of coins", err);
        });
		
        fetch("https://blocktrades.us/ol/api/v2/coins").then(reply => reply.json().then(result => {
            this.setState({
                openLedgerCoins: result
            });
            this.setState({
                openLedgerBackedCoins: this.getOpenledgerBackedCoins(result)
            });
        })).catch(err => {
            console.log("error fetching openledger list of coins", err);
        });
    }

    getBlocktradesBackedCoins(allBlocktradesCoins) {
        let coins_by_type = {};
        allBlocktradesCoins.forEach(coin_type => coins_by_type[coin_type.coinType] = coin_type);
        let blocktradesBackedCoins = [];
        allBlocktradesCoins.forEach(coin_type => {
            if (coin_type.walletSymbol.startsWith('TRADE.') && coin_type.backingCoinType)
            {
                blocktradesBackedCoins.push({
                    name: coins_by_type[coin_type.backingCoinType].name,
                    walletType: coins_by_type[coin_type.backingCoinType].walletType,
                    backingCoinType: coins_by_type[coin_type.backingCoinType].walletSymbol,
                    symbol: coin_type.walletSymbol,
					supportsMemos: coins_by_type[coin_type.backingCoinType].supportsOutputMemos
                });
            }});
        return blocktradesBackedCoins;
    }
	
	getOpenledgerBackedCoins(allOpenledgerCoins) {
        let coins_by_type = {};
        allOpenledgerCoins.forEach(coin_type => coins_by_type[coin_type.coinType] = coin_type);
        let openledgerBackedCoins = [];
        allOpenledgerCoins.forEach(coin_type => {
            if (coin_type.walletSymbol.startsWith('OPEN.') && coin_type.backingCoinType)
            {
                openledgerBackedCoins.push({
                    name: coins_by_type[coin_type.backingCoinType].name,
                    walletType: coins_by_type[coin_type.backingCoinType].walletType,
                    backingCoinType: coins_by_type[coin_type.backingCoinType].walletSymbol,
                    symbol: coin_type.walletSymbol,
					supportsMemos: coins_by_type[coin_type.backingCoinType].supportsOutputMemos
                });
            }});
        return openledgerBackedCoins;
    }

    toggleOLService(service) {
        this.setState({
            olService: service
        });

        SettingsActions.changeViewSetting({
            olService: service
        });
    }

    toggleBTService(service) {
        this.setState({
            btService: service
        });

        SettingsActions.changeViewSetting({
            btService: service
        });
    }

    toggleMetaService(service) {
        this.setState({
            metaService: service
        });

        SettingsActions.changeViewSetting({
            metaService: service
        });
    }

    onSetService(e) {
        let index = this.state.services.indexOf(e.target.value);
        this.setState({
            activeService: index
        });

        SettingsActions.changeViewSetting({
            activeService: index
        });
    }

    render() {
        let {account} = this.props;
        let {olService, btService, metaService, depositWithdrawDefaultActiveTab,
            services, activeService} = this.state;

        let blockTradesGatewayCoins = this.state.blockTradesBackedCoins.filter(coin => {
            if (coin.backingCoinType === "muse") {    // it is not filterring, should be MUSE
                return false;
            }
            return coin.symbol.toUpperCase().indexOf("TRADE") !== -1;
        })
        .map(coin => {
            return coin;
        })
        .sort((a, b) => { 
			if (a.symbol < b.symbol) 
				return -1 
			if (a.symbol > b.symbol)
				return 1
			return 0 
		});
		
        let openLedgerGatewayCoins = this.state.openLedgerBackedCoins.map(coin => {
            return coin;
        })
        .sort((a, b) => { 
			if (a.symbol < b.symbol) 
				return -1 
			if (a.symbol > b.symbol)
				return 1
			return 0 
		});

        let options = services.map(name => {
            return <option key={name} value={name}>{name}</option>;
        });


        return (
		<div className={this.props.contained ? "grid-content" : "grid-container"}>
            <div className={this.props.contained ? "" : "grid-content"}>
                <div style={{borderBottom: "2px solid #444"}}>
                    <HelpContent path="components/DepositWithdraw" section="receive" account={account.get("name")}/>
                    <HelpContent path="components/DepositWithdraw" section="deposit-short"/>
                </div>
                <div style={{paddingTop: 30, paddingLeft: 8, paddingBottom: 10, fontSize: 14}}>
                    <Translate content="gateway.service" />
                </div>
                <select onChange={this.onSetService.bind(this)} className="bts-select" value={services[activeService]} >
                    {options}
                </select>

    			<div className="grid-content" style={{paddingTop: 15}}>

                {activeService === services.indexOf("BlockTrades (TRADE.X)") ?
                <div>
                        <div className="content-block">
                            <div className="float-right"><a href="https://blocktrades.us" target="__blank"><Translate content="gateway.website" /></a></div>
                            <div className="button-group">
                                <div onClick={this.toggleBTService.bind(this, "bridge")} className={cnames("button", btService === "bridge" ? "active" : "outline")}><Translate content="gateway.bridge" /></div>
                                <div onClick={this.toggleBTService.bind(this, "gateway")} className={cnames("button", btService === "gateway" ? "active" : "outline")}><Translate content="gateway.gateway" /></div>
                            </div>

                            {btService === "bridge" ?
                            <BlockTradesBridgeDepositRequest
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={account}
                                initial_deposit_input_coin_type="btc"
                                initial_deposit_output_coin_type="bts"
                                initial_deposit_estimated_input_amount="1.0"
                                initial_withdraw_input_coin_type="bts"
                                initial_withdraw_output_coin_type="btc"
                                initial_withdraw_estimated_input_amount="100000"
                            /> : null}

                            {btService === "gateway" && blockTradesGatewayCoins.length ?
                            <BlockTradesGateway
                                account={account}
                                coins={blockTradesGatewayCoins}
                                provider="blocktrades"
                            /> : null}
                        </div>
                        <div className="content-block">


                        </div>
                    </div> : null}

                    {activeService === services.indexOf("Openledger (OPEN.X)") ?
                    <div>
                        <div className="content-block">
                            <div className="float-right">
                                <a href="https://www.ccedk.com/" target="__blank"><Translate content="gateway.website" /></a>
                            </div>
                            <div className="button-group" style={{marginBottom: 0}}>
                                <div onClick={this.toggleOLService.bind(this, "gateway")} className={cnames("button", olService === "gateway" ? "active" : "outline")}><Translate content="gateway.gateway" /></div>
                                <div onClick={this.toggleOLService.bind(this, "fiat")} className={cnames("button", olService === "fiat" ? "active" : "outline")}>Fiat</div>
                            </div>
                            
                            
                            {olService === "gateway" && openLedgerGatewayCoins.length ? 
                            <BlockTradesGateway
                                account={account}
                                coins={openLedgerGatewayCoins}
                                provider="openledger"
                            /> : null}

                            {olService === "fiat" ?
                            <div>
                                <div style={{paddingBottom: 15}}><Translate component="h5" content="gateway.fiat_text" /></div>

                                <OpenLedgerFiatDepositWithdrawal
                                        rpc_url="https://openledger.info/api/"
                                        account={account}
                                        issuer_account="openledger-fiat" />
                                <OpenLedgerFiatTransactionHistory
                                        rpc_url="https://openledger.info/api/"
                                        account={account} />
                            </div> : null}
                        </div>
                    </div> : null}

                    {activeService === services.indexOf("MetaExchange") ?
                    <div>
                        <div className="float-right"><a style={{textTransform: "capitalize"}} href="https://metaexchange.info" target="__blank"><Translate content="gateway.website" /></a></div>
                        <div className="button-group">
                            <div onClick={this.toggleMetaService.bind(this, "bridge")} className={cnames("button", metaService === "bridge" ? "active" : "outline")}><Translate content="gateway.bridge" /></div>
                            <div onClick={this.toggleMetaService.bind(this, "gateway")} className={cnames("button", metaService === "gateway" ? "active" : "outline")}><Translate content="gateway.gateway" /></div>
                        </div>

                        <MetaExchange
                            account={account}
                            service={metaService}
                        />
                    </div> : null}

                    {activeService === services.indexOf("Transwiser") ?
                    <div>
                        <div className="float-right"><a href="http://www.transwiser.com" target="_blank"><Translate content="gateway.website" /></a></div>
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
                                account={account.get('name')}
                                receiveAsset="TCNY" />
                            <TranswiserDepositWithdraw
                                issuerAccount="transwiser-wallet"
                                account={account.get('name')}
                                receiveAsset="CNY" />
                            {/*
                            <TranswiserDepositWithdraw
                                issuerAccount="transwiser-wallet"
                                account={this.props.account.get('name')}
                                receiveAsset="BOTSCNY" />
                            */}
                            </tbody>
                        </table>
                    </div> : null}

                </div>
            </div>
		</div>
    );
    }
};

@connectToStores
export default class DepositStoreWrapper extends React.Component {
    static getStores() {
        return [AccountStore, SettingsStore]
    };

    static getPropsFromStores() {
        return {
            account: AccountStore.getState().currentAccount,
            viewSettings: SettingsStore.getState().viewSettings
        }
    };

    render () {
        return <AccountDepositWithdraw {...this.props}/>
    }
}
