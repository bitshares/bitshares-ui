import React from "react";
import {
    fetchCoins,
    fetchTradingPairs,
    getActiveWallets
} from "common/gatewayMethods";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import WinexRecentTransactions from "components/DepositWithdraw/winex/WinexRecentTransactions";

import WinexGatewayRequest from "components/DepositWithdraw/winex/WinexGatewayRequest";
import LoadingIndicator from "components/LoadingIndicator";
import {widechainAPIs} from "api/apiConfig";

class WinexGateway extends React.Component {
    constructor(props) {
        super();

        const action = props.viewSettings.get(
            `${props.provider}Action`,
            "deposit"
        );
        this.state = {
            coins: [],
            activeCoin: this._getActiveCoin(props, {action}),
            action
        };
    }

    _getActiveCoin(props, state) {
        let cachedCoin = props.viewSettings.get(
            `activeCoin_Winex_${state.action}`,
            null
        );
        let firstTimeCoin = null;
        if (state.action == "deposit") {
            firstTimeCoin = "HSR";
        }
        if (state.action == "withdraw") {
            firstTimeCoin = "WIN.HSR";
        }
        let activeCoin = cachedCoin ? cachedCoin : firstTimeCoin;
        return activeCoin;
    }

    componentWillMount() {
        this._getCoins();
    }

    componentWillReceiveProps(nextProps) {
        if (
            nextProps.provider !== this.props.provider ||
            nextProps.action !== this.props.action
        ) {
            this.setState({
                activeCoin: this._getActiveCoin(nextProps, this.state.action)
            });
        }
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //     if (nextState.action !== this.state.action) {
    //         this.setState({
    //             activeCoin: this._getActiveCoin(nextProps, nextState)
    //         });
    //     }

    //     return true;
    // }

    onSelectCoin(e) {
        this.setState({
            activeCoin: e.target.value
        });

        let setting = {};
        setting[`activeCoin_${this.props.provider}_${this.state.action}`] =
            e.target.value;
        SettingsActions.changeViewSetting(setting);
    }

    changeAction(type) {
        let activeCoin = this._getActiveCoin(this.props, {action: type});

        this.setState({
            action: type,
            activeCoin: activeCoin
        });

        SettingsActions.changeViewSetting({
            [`${this.props.provider}Action`]: type
        });
    }

    _getCoins() {
        Promise.all([
            fetchCoins(widechainAPIs.BASE + widechainAPIs.COINS_LIST),
            fetchTradingPairs(widechainAPIs.BASE + widechainAPIs.TRADING_PAIRS),
            getActiveWallets(widechainAPIs.BASE + widechainAPIs.ACTIVE_WALLETS)
        ]).then(result => {
            let [coins, tradingPairs, wallets] = result;
            let backedCoins = this._getBackedCoins({
                allCoins: coins,
                tradingPairs: tradingPairs
            }).filter(a => !!a.walletType);
            backedCoins.forEach(a => {
                a.isAvailable = wallets.indexOf(a.walletType) !== -1;
            });
            this.setState({coins: backedCoins});
        });
    }

    _getBackedCoins({allCoins, tradingPairs}) {
        let coins_by_type = {};
        allCoins.forEach(
            coin_type => (coins_by_type[coin_type.coinType] = coin_type)
        );

        let allowed_outputs_by_input = {};
        tradingPairs.forEach(pair => {
            if (!allowed_outputs_by_input[pair.inputCoinType])
                allowed_outputs_by_input[pair.inputCoinType] = {};
            allowed_outputs_by_input[pair.inputCoinType][
                pair.outputCoinType
            ] = true;
        });
        let blocktradesBackedCoins = [];
        allCoins.forEach(coin_type => {
            if (
                coin_type.backingCoinType &&
                coins_by_type[coin_type.backingCoinType]
            ) {
                let isDepositAllowed =
                    allowed_outputs_by_input[coin_type.backingCoinType] &&
                    allowed_outputs_by_input[coin_type.backingCoinType][
                        coin_type.coinType
                    ];
                let isWithdrawalAllowed =
                    allowed_outputs_by_input[coin_type.coinType] &&
                    allowed_outputs_by_input[coin_type.coinType][
                        coin_type.backingCoinType
                    ];
                blocktradesBackedCoins.push({
                    name: coins_by_type[coin_type.backingCoinType].name,
                    intermediateAccount:
                        coins_by_type[coin_type.backingCoinType]
                            .intermediateAccount,
                    gateFee: coins_by_type[coin_type.backingCoinType].gateFee,
                    walletType:
                        coins_by_type[coin_type.backingCoinType].walletType,
                    backingCoinType:
                        coins_by_type[coin_type.backingCoinType].walletSymbol,
                    symbol: coin_type.walletSymbol,
                    supportsMemos:
                        coins_by_type[coin_type.backingCoinType]
                            .supportsOutputMemos,
                    depositAllowed: isDepositAllowed,
                    withdrawalAllowed: isWithdrawalAllowed,
                    minWithdrawAmount:
                        coins_by_type[coin_type.backingCoinType].minAmount,
                    maxWithdrawAmount:
                        coins_by_type[coin_type.backingCoinType].maxAmount,
                    feeType:
                        coins_by_type[coin_type.backingCoinType].gateFeeType
                });
            }
        });
        return blocktradesBackedCoins;
    }

    render() {
        let {account, provider} = this.props;
        let {activeCoin, action, coins} = this.state;
        if (!coins.length) {
            return <LoadingIndicator />;
        }

        let filteredCoins = coins.filter(a => {
            if (!a || !a.symbol) {
                return false;
            } else {
                return action === "deposit"
                    ? a.depositAllowed
                    : a.withdrawalAllowed;
            }
        });

        let coinOptions = filteredCoins
            .map(coin => {
                let option =
                    action === "deposit"
                        ? coin.backingCoinType.toUpperCase()
                        : coin.symbol;
                return (
                    <option value={option} key={coin.symbol}>
                        {option}
                    </option>
                );
            })
            .filter(a => {
                return a !== null;
            });

        let coin = filteredCoins.filter(coin => {
            return action === "deposit"
                ? coin.backingCoinType.toUpperCase() === activeCoin
                : coin.symbol === activeCoin;
        })[0];

        if (!coin) coin = filteredCoins[0];
        return (
            <div style={this.props.style}>
                <div className="grid-block no-margin vertical medium-horizontal no-padding">
                    <div className="medium-4">
                        <div>
                            <label
                                style={{minHeight: "2rem"}}
                                className="left-label"
                            >
                                <Translate
                                    content={"gateway.choose_" + action}
                                />:{" "}
                            </label>
                            <select
                                className="external-coin-types bts-select"
                                onChange={this.onSelectCoin.bind(this)}
                                value={activeCoin}
                            >
                                {coinOptions}
                            </select>
                        </div>
                    </div>

                    <div className="medium-6 medium-offset-1">
                        <label
                            style={{minHeight: "2rem"}}
                            className="left-label"
                        >
                            <Translate content="gateway.gateway_text" />:
                        </label>
                        <div style={{paddingBottom: 15}}>
                            <ul className="button-group segmented no-margin">
                                <li
                                    className={
                                        this.state.action === "deposit"
                                            ? "is-active"
                                            : ""
                                    }
                                >
                                    <a
                                        onClick={this.changeAction.bind(
                                            this,
                                            "deposit"
                                        )}
                                    >
                                        <Translate content="gateway.deposit" />
                                    </a>
                                </li>
                                <li
                                    className={
                                        this.state.action === "withdraw"
                                            ? "is-active"
                                            : ""
                                    }
                                >
                                    <a
                                        onClick={this.changeAction.bind(
                                            this,
                                            "withdraw"
                                        )}
                                    >
                                        <Translate content="gateway.withdraw" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {!coin ? null : (
                    <div>
                        <div style={{marginBottom: 15}}>
                            <WinexGatewayRequest
                                key={`${provider}.${coin.symbol}`}
                                gateway={provider}
                                issuer_account={coin.intermediateAccount}
                                account={account}
                                deposit_asset={coin.backingCoinType.toUpperCase()}
                                deposit_asset_name={coin.name}
                                deposit_coin_type={coin.backingCoinType.toLowerCase()}
                                deposit_account={coin.depositAccount}
                                deposit_wallet_type={coin.walletType}
                                gateFee={coin.gateFee}
                                receive_asset={coin.symbol}
                                receive_coin_type={coin.symbol.toLowerCase()}
                                supports_output_memos={coin.supportsMemos}
                                isAvailable={coin.isAvailable}
                                min_withdraw_amount={coin.minWithdrawAmount}
                                max_withdraw_amount={coin.maxWithdrawAmount}
                                fee_type={coin.feeType}
                                action={this.state.action}
                            />
                        </div>

                        <WinexRecentTransactions
                            account={account.get("name")}
                            action={this.state.action}
                        />
                    </div>
                )}
            </div>
        );
    }
}

export default connect(WinexGateway, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
