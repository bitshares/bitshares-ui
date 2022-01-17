import React from "react";
import {connect} from "alt-react";
import accountUtils from "common/account_utils";
import {updateGatewayBackers} from "common/gatewayUtils";
import utils from "common/utils";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import OpenledgerGateway from "../DepositWithdraw/OpenledgerGateway";
import OpenLedgerFiatDepositWithdrawal from "../DepositWithdraw/openledger/OpenLedgerFiatDepositWithdrawal";
import OpenLedgerFiatTransactionHistory from "../DepositWithdraw/openledger/OpenLedgerFiatTransactionHistory";
import BlockTradesBridgeDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesBridgeDepositRequest";
import CitadelBridgeDepositRequest from "../DepositWithdraw/citadel/CitadelBridgeDepositRequest";
import HelpContent from "../Utility/HelpContent";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import {openledgerAPIs} from "api/apiConfig";
import RuDexGateway from "../DepositWithdraw/rudex/RuDexGateway";
import GatewayStore from "stores/GatewayStore";
import AccountImage from "../Account/AccountImage";
import BitsparkGateway from "../DepositWithdraw/bitspark/BitsparkGateway";
import GdexGateway from "../DepositWithdraw/gdex/GdexGateway";
import XbtsxGateway from "../DepositWithdraw/xbtsx/XbtsxGateway";
import PropTypes from "prop-types";
import DepositModal from "../Modal/DepositModal";
import WithdrawModal from "../Modal/WithdrawModalNew";
import TranslateWithLinks from "../Utility/TranslateWithLinks";

class AccountDepositWithdraw extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        contained: PropTypes.bool
    };

    static defaultProps = {
        contained: false
    };

    constructor(props) {
        super();
        this.state = {
            olService: props.viewSettings.get("olService", "gateway"),
            rudexService: props.viewSettings.get("rudexService", "gateway"),
            bitsparkService: props.viewSettings.get(
                "bitsparkService",
                "gateway"
            ),
            xbtsxService: props.viewSettings.get("xbtsxService", "gateway"),
            btService: props.viewSettings.get("btService", "bridge"),
            citadelService: props.viewSettings.get("citadelService", "bridge"),
            metaService: props.viewSettings.get("metaService", "bridge"),
            activeService: props.viewSettings.get("activeService", 0)
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.account !== this.props.account ||
            nextProps.servicesDown !== this.props.servicesDown ||
            !utils.are_equal_shallow(
                nextProps.blockTradesBackedCoins,
                this.props.blockTradesBackedCoins
            ) ||
            !utils.are_equal_shallow(
                nextProps.openLedgerBackedCoins,
                this.props.openLedgerBackedCoins
            ) ||
            !utils.are_equal_shallow(
                nextProps.citadelBackedCoins,
                this.props.citadelBackedCoins
            ) ||
            nextState.olService !== this.state.olService ||
            nextState.rudexService !== this.state.rudexService ||
            nextState.bitsparkService !== this.state.bitsparkService ||
            nextState.xbtsxService !== this.state.xbtsxService ||
            nextState.btService !== this.state.btService ||
            nextState.citadelService !== this.state.citadelService ||
            nextState.metaService !== this.state.metaService ||
            nextState.activeService !== this.state.activeService
        );
    }

    UNSAFE_componentWillMount() {
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

    toggleRuDEXService(service) {
        this.setState({
            rudexService: service
        });

        SettingsActions.changeViewSetting({
            rudexService: service
        });
    }

    toggleXbtsxService(service) {
        this.setState({
            xbtsxService: service
        });

        SettingsActions.changeViewSetting({
            xbtsxService: service
        });
    }

    toggleBitSparkService(service) {
        this.setState({
            bitsparkService: service
        });

        SettingsActions.changeViewSetting({
            bitsparkService: service
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

    toggleCitadelService(service) {
        this.setState({
            citadelService: service
        });
        SettingsActions.changeViewSetting({
            citadelService: service
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

    renderServices(
        openLedgerGatewayCoins,
        rudexGatewayCoins,
        bitsparkGatewayCoins,
        xbtsxGatewayCoins
    ) {
        //let services = ["Openledger (OPEN.X)", "BlockTrades (TRADE.X)", "Transwiser", "BitKapital"];
        let serList = [];
        let {account} = this.props;
        let {
            olService,
            btService,
            rudexService,
            bitsparkService,
            xbtsxService,
            citadelService
        } = this.state;
        serList.push({
            name: "Openledger (OPEN.X)",
            identifier: "OPEN",
            template: (
                <div className="content-block">
                    <div
                        className="service-selector"
                        style={{marginBottom: "2rem"}}
                    >
                        <ul className="button-group segmented no-margin">
                            <li
                                onClick={this.toggleOLService.bind(
                                    this,
                                    "gateway"
                                )}
                                className={
                                    olService === "gateway" ? "is-active" : ""
                                }
                            >
                                <a>
                                    <Translate content="gateway.gateway" />
                                </a>
                            </li>
                            <li
                                onClick={this.toggleOLService.bind(
                                    this,
                                    "fiat"
                                )}
                                className={
                                    olService === "fiat" ? "is-active" : ""
                                }
                            >
                                <Translate
                                    component="a"
                                    content="gateway.fiat"
                                />
                            </li>
                        </ul>
                    </div>

                    {olService === "gateway" &&
                    openLedgerGatewayCoins.length ? (
                        <OpenledgerGateway
                            account={account}
                            coins={openLedgerGatewayCoins}
                            provider="openledger"
                        />
                    ) : null}

                    {olService === "fiat" ? (
                        <div>
                            <div style={{paddingBottom: 15}}>
                                <Translate
                                    component="h5"
                                    content="gateway.fiat_text"
                                    unsafe
                                />
                            </div>

                            <OpenLedgerFiatDepositWithdrawal
                                rpc_url={openledgerAPIs.RPC_URL}
                                account={account}
                                issuer_account="openledger-fiat"
                            />
                            <OpenLedgerFiatTransactionHistory
                                rpc_url={openledgerAPIs.RPC_URL}
                                account={account}
                            />
                        </div>
                    ) : null}
                </div>
            )
        });

        serList.push({
            name: "RuDEX (RUDEX.X)",
            identifier: "RUDEX",
            template: (
                <div className="content-block">
                    <div
                        className="service-selector"
                        style={{marginBottom: "2rem"}}
                    >
                        <ul className="button-group segmented no-margin">
                            <li
                                onClick={this.toggleRuDEXService.bind(
                                    this,
                                    "gateway"
                                )}
                                className={
                                    rudexService === "gateway"
                                        ? "is-active"
                                        : ""
                                }
                            >
                                <a>
                                    <Translate content="gateway.gateway" />
                                </a>
                            </li>
                            <li
                                onClick={this.toggleRuDEXService.bind(
                                    this,
                                    "fiat"
                                )}
                                className={
                                    rudexService === "fiat" ? "is-active" : ""
                                }
                            >
                                <a>Fiat</a>
                            </li>
                        </ul>
                    </div>

                    {rudexService === "gateway" && rudexGatewayCoins.length ? (
                        <RuDexGateway
                            account={account}
                            coins={rudexGatewayCoins}
                        />
                    ) : null}

                    {rudexService === "fiat" ? (
                        <div>
                            <Translate content="gateway.rudex.coming_soon" />
                        </div>
                    ) : null}
                </div>
            )
        });

        serList.push({
            name: "BitSpark (SPARKDEX.X)",
            identifier: "SPARKDEX",
            template: (
                <div className="content-block">
                    <div
                        className="service-selector"
                        style={{marginBottom: "2rem"}}
                    >
                        <ul className="button-group segmented no-margin">
                            <li
                                onClick={this.toggleBitSparkService.bind(
                                    this,
                                    "gateway"
                                )}
                                className={
                                    bitsparkService === "gateway"
                                        ? "is-active"
                                        : ""
                                }
                            >
                                <a>
                                    <Translate content="gateway.gateway" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {bitsparkService === "gateway" &&
                    bitsparkGatewayCoins.length ? (
                        <BitsparkGateway
                            account={account}
                            coins={bitsparkGatewayCoins}
                            provider="bitspark"
                        />
                    ) : null}
                </div>
            )
        });

        serList.push({
            name: "XBTS (XBTSX.X)",
            identifier: "XBTSX",
            template: (
                <div className="content-block">
                    <div
                        className="service-selector"
                        style={{marginBottom: "2rem"}}
                    >
                        <ul className="button-group segmented no-margin">
                            <li
                                onClick={this.toggleXbtsxService.bind(
                                    this,
                                    "gateway"
                                )}
                                className={
                                    xbtsxService === "gateway"
                                        ? "is-active"
                                        : ""
                                }
                            >
                                <a>
                                    <Translate content="gateway.gateway" />
                                </a>
                            </li>
                            <li
                                onClick={this.toggleXbtsxService.bind(
                                    this,
                                    "fiat"
                                )}
                                className={
                                    xbtsxService === "fiat" ? "is-active" : ""
                                }
                            >
                                <a>Fiat</a>
                            </li>
                        </ul>
                    </div>

                    {xbtsxService === "gateway" && xbtsxGatewayCoins.length ? (
                        <XbtsxGateway
                            account={account}
                            coins={xbtsxGatewayCoins}
                        />
                    ) : null}

                    {xbtsxService === "fiat" ? (
                        <div>
                            <Translate content="gateway.xbtsx.coming_soon" />
                        </div>
                    ) : null}
                </div>
            )
        });

        serList.push({
            name: "BlockTrades",
            identifier: "TRADE",
            template: (
                <div>
                    <div className="content-block">
                        <div
                            className="service-selector"
                            style={{marginBottom: "2rem"}}
                        >
                            <ul className="button-group segmented no-margin">
                                <li
                                    onClick={this.toggleBTService.bind(
                                        this,
                                        "bridge"
                                    )}
                                    className={
                                        btService === "bridge"
                                            ? "is-active"
                                            : ""
                                    }
                                >
                                    <a>
                                        <Translate content="gateway.bridge" />
                                    </a>
                                </li>
                            </ul>
                        </div>

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
                            params={this.props.location}
                        />
                    </div>
                    <div className="content-block" />
                </div>
            )
        });

        serList.push({
            name: "Citadel",
            identifier: "CITADEL",
            template: (
                <div>
                    <div className="content-block">
                        <div
                            className="service-selector"
                            style={{marginBottom: "2rem"}}
                        >
                            <ul className="button-group segmented no-margin">
                                <li
                                    onClick={this.toggleCitadelService.bind(
                                        this,
                                        "bridge"
                                    )}
                                    className={
                                        citadelService === "bridge"
                                            ? "is-active"
                                            : ""
                                    }
                                >
                                    <a>
                                        <Translate content="gateway.bridge" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <CitadelBridgeDepositRequest
                            gateway="citadel"
                            issuer_account="citadel-wallet"
                            account={account}
                            initial_deposit_input_coin_type="xmr"
                            initial_deposit_output_coin_type="citadel.monero"
                            initial_deposit_estimated_input_amount="1.0"
                            initial_withdraw_input_coin_type="citadel.monero"
                            initial_withdraw_output_coin_type="xmr"
                            initial_withdraw_estimated_input_amount="1.0"
                        />
                    </div>
                    <div className="content-block" />
                </div>
            )
        });

        serList.push({
            name: "GDEX",
            identifier: "GDEX",
            template: (
                <div>
                    <GdexGateway account={account} provider={"gdex"} />
                </div>
            )
        });

        return serList;
    }

    render() {
        let {account, servicesDown} = this.props;
        let {activeService} = this.state;

        let openLedgerGatewayCoins = this.props.openLedgerBackedCoins
            .map(coin => {
                return coin;
            })
            .sort((a, b) => {
                if (a.symbol < b.symbol) return -1;
                if (a.symbol > b.symbol) return 1;
                return 0;
            });

        let rudexGatewayCoins = this.props.rudexBackedCoins
            .map(coin => {
                return coin;
            })
            .sort((a, b) => {
                if (a.symbol < b.symbol) return -1;
                if (a.symbol > b.symbol) return 1;
                return 0;
            });

        let bitsparkGatewayCoins = this.props.bitsparkBackedCoins
            .map(coin => {
                return coin;
            })
            .sort((a, b) => {
                if (a.symbol < b.symbol) return -1;
                if (a.symbol > b.symbol) return 1;
                return 0;
            });

        let xbtsxGatewayCoins = this.props.xbtsxBackedCoins
            .map(coin => {
                return coin;
            })
            .sort((a, b) => {
                if (a.symbol < b.symbol) return -1;
                if (a.symbol > b.symbol) return 1;
                return 0;
            });

        let services = this.renderServices(
            openLedgerGatewayCoins,
            rudexGatewayCoins,
            bitsparkGatewayCoins,
            xbtsxGatewayCoins
        );

        const serviceNames = [];
        let options = services.map((services_obj, index) => {
            serviceNames.push(services_obj.identifier);
            return (
                <option key={index} value={index}>
                    {services_obj.name}
                </option>
            );
        });

        const currentServiceName = serviceNames[activeService];
        const currentServiceDown = servicesDown.get(currentServiceName);

        return (
            <div
                className={
                    this.props.contained ? "grid-content" : "grid-container"
                }
            >
                <div
                    className={this.props.contained ? "" : "grid-content"}
                    style={{paddingTop: "2rem"}}
                >
                    <div className="grid-block vertical medium-horizontal no-margin no-padding">
                        <div style={{paddingBottom: "1rem"}}>
                            <DepositModal
                                ref="deposit_modal"
                                modalId="deposit_modal_new"
                                account={this.props.currentAccount}
                                backedCoins={this.props.backedCoins}
                            />
                            <WithdrawModal
                                ref="withdraw_modal"
                                modalId="withdraw_modal_new"
                                backedCoins={this.props.backedCoins}
                            />
                            <TranslateWithLinks
                                string="gateway.phase_out_warning"
                                keys={[
                                    {
                                        arg: "deposit_modal_link",
                                        value: (
                                            <a
                                                onClick={() => {
                                                    if (this.refs.deposit_modal)
                                                        this.refs.deposit_modal.show();
                                                }}
                                            >
                                                <Translate content="modal.deposit.submit" />
                                            </a>
                                        )
                                    },
                                    {
                                        arg: "withdraw_modal_link",
                                        value: (
                                            <a
                                                onClick={() => {
                                                    if (
                                                        this.refs.withdraw_modal
                                                    )
                                                        this.refs.withdraw_modal.show();
                                                }}
                                            >
                                                <Translate content="modal.withdraw.submit" />
                                            </a>
                                        )
                                    }
                                ]}
                            />
                        </div>
                    </div>
                    <Translate content="gateway.title" component="h2" />
                    <div className="grid-block vertical medium-horizontal no-margin no-padding">
                        <div className="medium-6 show-for-medium">
                            <HelpContent
                                path="components/DepositWithdraw"
                                section="deposit-short"
                            />
                        </div>
                        <div className="medium-5 medium-offset-1">
                            <HelpContent
                                account={account.get("name")}
                                path="components/DepositWithdraw"
                                section="receive"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="grid-block vertical medium-horizontal no-margin no-padding">
                            <div className="medium-6 small-order-2 medium-order-1">
                                <Translate
                                    component="label"
                                    className="left-label"
                                    content="gateway.service"
                                />
                                <select
                                    onChange={this.onSetService.bind(this)}
                                    className="bts-select"
                                    value={activeService}
                                >
                                    {options}
                                </select>
                                {currentServiceDown ? (
                                    <Translate
                                        style={{
                                            color: "red",
                                            marginBottom: "1em",
                                            display: "block"
                                        }}
                                        content={`gateway.unavailable_${currentServiceName}`}
                                    />
                                ) : null}
                            </div>
                            <div
                                className="medium-5 medium-offset-1 small-order-1 medium-order-2"
                                style={{paddingBottom: 20}}
                            >
                                <Translate
                                    component="label"
                                    className="left-label"
                                    content="gateway.your_account"
                                />
                                <div className="inline-label">
                                    <AccountImage
                                        size={{height: 40, width: 40}}
                                        account={account.get("name")}
                                        custom_image={null}
                                    />
                                    <input
                                        type="text"
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

                    <div
                        className="grid-content no-padding"
                        style={{paddingTop: 15}}
                    >
                        {currentServiceDown
                            ? null
                            : activeService && services[activeService]
                            ? services[activeService].template
                            : services[0].template}
                    </div>
                </div>
            </div>
        );
    }
}
AccountDepositWithdraw = BindToChainState(AccountDepositWithdraw);

class DepositStoreWrapper extends React.Component {
    UNSAFE_componentWillMount() {
        updateGatewayBackers();
    }

    render() {
        return <AccountDepositWithdraw {...this.props} />;
    }
}

export default connect(DepositStoreWrapper, {
    listenTo() {
        return [AccountStore, SettingsStore, GatewayStore];
    },
    getProps() {
        return {
            currentAccount:
                AccountStore.getState().currentAccount ||
                AccountStore.getState().passwordAccount,
            account: AccountStore.getState().currentAccount,
            viewSettings: SettingsStore.getState().viewSettings,
            backedCoins: GatewayStore.getState().backedCoins,
            openLedgerBackedCoins: GatewayStore.getState().backedCoins.get(
                "OPEN",
                []
            ),
            rudexBackedCoins: GatewayStore.getState().backedCoins.get(
                "RUDEX",
                []
            ),
            bitsparkBackedCoins: GatewayStore.getState().backedCoins.get(
                "SPARKDEX",
                []
            ),
            blockTradesBackedCoins: GatewayStore.getState().backedCoins.get(
                "TRADE",
                []
            ),
            citadelBackedCoins: GatewayStore.getState().backedCoins.get(
                "CITADEL",
                []
            ),
            xbtsxBackedCoins: GatewayStore.getState().backedCoins.get(
                "XBTSX",
                []
            ),
            servicesDown: GatewayStore.getState().down || {}
        };
    }
});
