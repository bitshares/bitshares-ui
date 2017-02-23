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
import {fetchCoins, getBackedCoins} from "common/blockTradesMethods";

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
            services: ["Openledger (OPEN.X)", "BlockTrades (TRADE.X)", "Transwiser"]
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

        fetchCoins("https://blocktrades.us/api/v2/coins").then(result => {
            this.setState({
                blockTradesCoins: result,
                blockTradesBackedCoins: getBackedCoins({allCoins: result, backer: "TRADE"})
            });
        });

        fetchCoins().then(result => {
            this.setState({
                openLedgerCoins: result,
                openLedgerBackedCoins: getBackedCoins({allCoins: result, backer: "OPEN"})
            });
        });
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
            if (coin.backingCoinType === "muse") {
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

                <div className="grid-content no-padding" style={{paddingTop: 15}}>

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
AccountDepositWithdraw = BindToChainState(AccountDepositWithdraw);

class DepositStoreWrapper extends React.Component {
    render () {
        return <AccountDepositWithdraw {...this.props}/>;
    }
}

export default connect(DepositStoreWrapper, {
    listenTo() {
        return [AccountStore, SettingsStore];
    },
    getProps() {
        return {
            account: AccountStore.getState().currentAccount,
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
