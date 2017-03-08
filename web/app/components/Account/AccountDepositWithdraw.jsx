import React from "react";
import { connect } from "alt-react";
import accountUtils from "common/account_utils";
import utils from "common/utils";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import TranswiserDepositWithdraw from "../DepositWithdraw/transwiser/TranswiserDepositWithdraw";
import BlockTradesBridgeDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesBridgeDepositRequest";
import BlockTradesGateway from "../DepositWithdraw/BlockTradesGateway";
import OpenLedgerFiatDepositWithdrawal from "../DepositWithdraw/openledger/OpenLedgerFiatDepositWithdrawal";
import OpenLedgerFiatTransactionHistory from "../DepositWithdraw/openledger/OpenLedgerFiatTransactionHistory";
import HelpContent from "../Utility/HelpContent";
import cnames from "classnames";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import { Apis } from "bitsharesjs-ws";
import { settingsAPIs } from "api/apiConfig";
import BitKapital from "../DepositWithdraw/BitKapital";
import GatewayStore from "stores/GatewayStore";
import GatewayActions from "actions/GatewayActions";
import AccountImage from "../Account/AccountImage";

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
            olService: props.viewSettings.get("olService", "gateway"),
            btService: props.viewSettings.get("btService", "bridge"),
            metaService: props.viewSettings.get("metaService", "bridge"),
            activeService: props.viewSettings.get("activeService", 0)
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.account !== this.props.account ||
            !utils.are_equal_shallow(nextProps.blockTradesBackedCoins, this.props.blockTradesBackedCoins) ||
            !utils.are_equal_shallow(nextProps.openLedgerBackedCoins, this.props.openLedgerBackedCoins) ||
            nextState.olService !== this.state.olService ||
            nextState.btService !== this.state.btService ||
            nextState.metaService !== this.state.metaService ||
            nextState.activeService !== this.state.activeService
        );
    }

    componentWillMount() {
        accountUtils.getFinalFeeAsset(this.props.account, "transfer");
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
        //let index = this.state.services.indexOf(e.target.value);
        this.setState({
            activeService: parseInt(e.target.value)
        });

        SettingsActions.changeViewSetting({
            activeService: parseInt(e.target.value)
        });
    }

    renderServices(blockTradesGatewayCoins, openLedgerGatewayCoins) {
        //let services = ["Openledger (OPEN.X)", "BlockTrades (TRADE.X)", "Transwiser", "BitKapital"];
        let serList = [];
        let { account } = this.props;
        let { olService, btService } = this.state;

        serList.push({
            name: "Openledger (OPEN.X)",
            template: (
                <div className="content-block">
                        {/* <div className="float-right">
                            <a href="https://www.ccedk.com/" target="__blank"><Translate content="gateway.website" /></a>
                        </div> */}
                        <div className="service-selector">
                            <ul className="button-group segmented no-margin">
                                <li onClick={this.toggleOLService.bind(this, "gateway")} className={olService === "gateway" ? "is-active" : ""}><a><Translate content="gateway.gateway" /></a></li>
                                <li onClick={this.toggleOLService.bind(this, "fiat")} className={olService === "fiat" ? "is-active" : ""}><a>Fiat</a></li>
                            </ul>
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
                                rpc_url={settingsAPIs.RPC_URL}
                                account={account}
                                issuer_account="openledger-fiat" />
                            <OpenLedgerFiatTransactionHistory
                                rpc_url={settingsAPIs.RPC_URL}
                                account={account} />
                        </div> : null}
                    </div>
            )
        });

        serList.push({
            name: "BlockTrades (TRADE.X)",
            template: (
                <div>
                        <div className="content-block">
                            {/* <div className="float-right"><a href="https://blocktrades.us" target="__blank"><Translate content="gateway.website" /></a></div> */}
                            <div className="button-group">
                                <div onClick={this.toggleBTService.bind(this, "bridge")} className={cnames("button", btService === "bridge" ? "active" : "outline")}><Translate content="gateway.bridge" /></div>
                                <div onClick={this.toggleBTService.bind(this, "gateway")} className={cnames("button", btService === "gateway" ? "active" : "outline")}><Translate content="gateway.gateway" /></div>
                            </div>

                            {btService === "bridge" ?
                            <BlockTradesBridgeDepositRequest
                                gateway="blocktrades"
                                issuer_account="blocktrades"
                                account={account}
                                initial_deposit_input_coin_type="btc"
                                initial_deposit_output_coin_type="bts"
                                initial_deposit_estimated_input_amount="1.0"
                                initial_withdraw_input_coin_type="bts"
                                initial_withdraw_output_coin_type="btc"
                                initial_withdraw_estimated_input_amount="100000"
                                initial_conversion_input_coin_type="bts"
                                initial_conversion_output_coin_type="bitbtc"
                                initial_conversion_estimated_input_amount="1000"
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
                    </div>)
        });

        serList.push({
            name: "Transwiser",
            template: (
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
                            account={account.get("name")}
                            receiveAsset="TCNY" />
                        <TranswiserDepositWithdraw
                            issuerAccount="transwiser-wallet"
                            account={account.get("name")}
                            receiveAsset="CNY" />
                        {/*
                        <TranswiserDepositWithdraw
                            issuerAccount="transwiser-wallet"
                            account={this.props.account.get("name")}
                            receiveAsset="BOTSCNY" />
                        */}
                        </tbody>
                    </table>
                </div>
            )
        });

        serList.push({
            name: "BitKapital",
            template: (<BitKapital viewSettings={this.props.viewSettings} account={account}/>)
        });

        return serList;
    }

    render() {
        let { account } = this.props;
        let { activeService } = this.state;

        let blockTradesGatewayCoins = this.props.blockTradesBackedCoins.filter(coin => {
            if (coin.backingCoinType.toLowerCase() === "muse") {
                return false;
            }
            return coin.symbol.toUpperCase().indexOf("TRADE") !== -1;
        })
        .map(coin => {
            return coin;
        })
        .sort((a, b) => {
            if (a.symbol < b.symbol)
                return -1;
            if (a.symbol > b.symbol)
                return 1;
            return 0;
        });

        let openLedgerGatewayCoins = this.props.openLedgerBackedCoins.map(coin => {
            return coin;
        })
        .sort((a, b) => {
            if (a.symbol < b.symbol)
                return -1;
            if (a.symbol > b.symbol)
                return 1;
            return 0;
        });

        let services = this.renderServices(blockTradesGatewayCoins, openLedgerGatewayCoins);

        let options = services.map((services_obj, index) => {
            return <option key={index} value={index}>{services_obj.name}</option>;
        });
        return (
            <div className={this.props.contained ? "grid-content" : "grid-container"}>
                <div className={this.props.contained ? "" : "grid-content"} style={{paddingTop: "2rem"}}>

                    <h2>Deposit & Withdraw</h2>
                    <div className="grid-block vertical medium-horizontal no-margin no-padding">
                        <div className="medium-6 show-for-medium">
                            <HelpContent path="components/DepositWithdraw" section="deposit-short"/>
                        </div>
                        <div className="medium-5 medium-offset-1">
                            <HelpContent path="components/DepositWithdraw" section="receive"/>
                        </div>
                    </div>
                    <div>
                        <div className="grid-block vertical medium-horizontal no-margin no-padding">
                            <div className="medium-6 small-order-2 medium-order-1">
                                <Translate component="label" className="left-label" content="gateway.service" />
                                <select onChange={this.onSetService.bind(this)} className="bts-select" value={activeService} >
                                    {options}
                                </select>
                            </div>
                            <div className="medium-5 medium-offset-1 small-order-1 medium-order-2" style={{paddingBottom: 20}}>
                                <label className="left-label" content="gateway.yours">Your account</label>
                                <div className="inline-label">
                                    <AccountImage
                                        size={{height: 40, width: 40}}
                                        account={account.get("name")} custom_image={null}
                                    />
                                    <input type="text"
                                           value={account.get("name")}
                                           placeholder={null}
                                           disabled
                                           onChange={() => {}}
                                           onKeyDown={() => {}}
                                           tabIndex={1}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid-content no-padding" style={{paddingTop: 15}}>
                    {activeService && services[activeService] ? services[activeService].template : services[0].template}
                    </div>
                </div>
            </div>
        );
    }
};
AccountDepositWithdraw = BindToChainState(AccountDepositWithdraw);

class DepositStoreWrapper extends React.Component {

    componentWillMount() {
        if (Apis.instance().chain_id.substr(0, 8) === "4018d784") { // Only fetch this when on BTS main net
            GatewayActions.fetchCoins.defer(); // Openledger
            GatewayActions.fetchCoins.defer({backer: "TRADE"}); // Blocktrades
        }
    }

    render() {
        return <AccountDepositWithdraw {...this.props}/>;
    }
}

export default connect(DepositStoreWrapper, {
    listenTo() {
        return [AccountStore, SettingsStore, GatewayStore];
    },
    getProps() {
        return {
            account: AccountStore.getState().currentAccount,
            viewSettings: SettingsStore.getState().viewSettings,
            openLedgerBackedCoins: GatewayStore.getState().backedCoins.get("OPEN", []),
            blockTradesBackedCoins: GatewayStore.getState().backedCoins.get("TRADE", [])
        };
    }
});
