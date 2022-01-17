import React from "react";
import BitsparkGatewayDepositRequest from "./BitsparkGatewayDepositRequest";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import {
    RecentTransactions,
    TransactionWrapper
} from "components/Account/RecentTransactions";
import Immutable from "immutable";
import LoadingIndicator from "../../LoadingIndicator";

class BitsparkGateway extends React.Component {
    constructor(props) {
        super();

        const action = props.viewSettings.get(
            `${props.provider}Action`,
            "deposit"
        );
        this.state = {
            activeCoin: this._getActiveCoin(props, {action}),
            action
        };
    }

    _getActiveCoin(props, state) {
        let cachedCoin = props.viewSettings.get(
            `activeCoin_${props.provider}_${state.action}`,
            null
        );
        let firstTimeCoin = null;
        if (state.action == "deposit") {
            firstTimeCoin = "BTC";
        }
        if (state.action == "withdraw") {
            firstTimeCoin = "SPARKDEX.BTC";
        }
        let activeCoin = cachedCoin ? cachedCoin : firstTimeCoin;
        return activeCoin;
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.provider !== this.props.provider) {
            this.setState({
                activeCoin: this._getActiveCoin(nextProps, this.state.action)
            });
        }
    }

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

    render() {
        let {coins, account, provider} = this.props;
        let {activeCoin, action} = this.state;
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

        let issuers = {
            bitspark: {
                name: coin.intermediateAccount,
                id: "1.2.1070206",
                support: "info@bitspark.io"
            }
        };

        let issuer = issuers[provider];

        let isDeposit = this.state.action === "deposit";

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
                                />
                                :{" "}
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
                                        action === "deposit" ? "is-active" : ""
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
                                        action === "withdraw" ? "is-active" : ""
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
                            <BitsparkGatewayDepositRequest
                                key={`${provider}.${coin.symbol}`}
                                gateway={provider}
                                issuer_account={issuer.name}
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
                                action={this.state.action}
                            />
                            <label className="left-label">Support</label>
                            <div>
                                <Translate content="gateway.bitspark.support_block" />
                                <br />
                                <br />
                                <a
                                    href={
                                        (issuer.support.indexOf("@") === -1
                                            ? ""
                                            : "mailto:") + issuer.support
                                    }
                                    rel="noopener noreferrer"
                                >
                                    {issuer.support}
                                </a>
                            </div>
                        </div>

                        {coin && coin.symbol ? (
                            <TransactionWrapper
                                asset={coin.symbol}
                                fromAccount={
                                    isDeposit
                                        ? issuer.id
                                        : this.props.account.get("id")
                                }
                                to={
                                    isDeposit
                                        ? this.props.account.get("id")
                                        : issuer.id
                                }
                            >
                                {({asset, to, fromAccount}) => {
                                    return (
                                        <RecentTransactions
                                            accountsList={Immutable.List([
                                                this.props.account.get("id")
                                            ])}
                                            limit={10}
                                            compactView={true}
                                            fullHeight={true}
                                            filter="transfer"
                                            title={
                                                <Translate
                                                    content={
                                                        "gateway.recent_" +
                                                        this.state.action
                                                    }
                                                />
                                            }
                                            customFilter={{
                                                fields: [
                                                    "to",
                                                    "from",
                                                    "asset_id"
                                                ],
                                                values: {
                                                    to: to.get("id"),
                                                    from: fromAccount.get("id"),
                                                    asset_id: asset.get("id")
                                                }
                                            }}
                                        />
                                    );
                                }}
                            </TransactionWrapper>
                        ) : null}
                    </div>
                )}
            </div>
        );
    }
}

export default connect(BitsparkGateway, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
