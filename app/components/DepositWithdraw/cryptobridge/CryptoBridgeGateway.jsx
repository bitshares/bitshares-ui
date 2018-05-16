import React from "react";
import CryptoBridgeGatewayDepositRequest from "./CryptoBridgeGatewayDepositRequest";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import ChainTypes from "components/Utility/ChainTypes";
import {
    RecentTransactions,
    TransactionWrapper
} from "components/Account/RecentTransactions";
import assetUtils from "common/asset_utils";
import DepositWithdrawAssetSelector from "../DepositWithdrawAssetSelector";
import Immutable from "immutable";
import LoadingIndicator from "../../LoadingIndicator";

class CryptoBridgeGateway extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount,
        coins: React.PropTypes.array,
        provider: React.PropTypes.string
    };

    static defaultProps = {
        provider: "CryptoBridge"
    };

    constructor(props) {
        super();

        this.state = {
            activeCoin: this._getActiveCoin(props),
            action: props.viewSettings.get(`${props.provider}Action`, "deposit")
        };
    }

    _getActiveCoin(props) {
        let cachedCoin = props.viewSettings.get(
            `activeCoin_${props.provider}`,
            null
        );
        let firstTimeCoin = "BCO";
        let activeCoin = cachedCoin ? cachedCoin : firstTimeCoin;
        return activeCoin;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.provider !== this.props.provider) {
            this.setState({
                activeCoin: this._getActiveCoin(nextProps)
            });
        }
    }

    changeAction(type) {
        let activeCoin = this._getActiveCoin(this.props);

        this.setState({
            action: type,
            activeCoin: activeCoin
        });

        SettingsActions.changeViewSetting({
            [`${this.props.provider}Action`]: type
        });
    }

    onAssetSelected = asset => {
        this.setState({
            activeCoin: asset
        });

        let setting = {};
        setting[`activeCoin_${this.props.provider}`] = asset;
        SettingsActions.changeViewSetting(setting);
    };

    render() {
        let {coins, account, provider} = this.props;
        let {activeCoin, action} = this.state;

        const isDeposit = this.state.action === "deposit";

        const coinIssuer = {
            name: "cryptobridge",
            id: "1.2.374566",
            support: "support@crypto-bridge.org"
        };

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

        const symbolsToInclude = filteredCoins.map(coin => {
            return coin.backingCoinType.toUpperCase();
        });

        let coin = filteredCoins.filter(coin => {
            return isDeposit
                ? assetUtils.getCleanAssetSymbol(coin.backingCoinType) ===
                      activeCoin
                : assetUtils.getCleanAssetSymbol(coin.symbol) === activeCoin;
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
                            <DepositWithdrawAssetSelector
                                onSelect={this.onAssetSelected.bind(this)}
                                include={symbolsToInclude}
                                selectOnBlur
                                defaultValue={activeCoin}
                                includeBTS={false}
                                usageContext={action}
                                noLabel={true}
                            />
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
                                <li className={isDeposit ? "is-active" : ""}>
                                    <a
                                        onClick={this.changeAction.bind(
                                            this,
                                            "deposit"
                                        )}
                                    >
                                        <Translate content="gateway.deposit" />
                                    </a>
                                </li>
                                <li className={!isDeposit ? "is-active" : ""}>
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
                            <CryptoBridgeGatewayDepositRequest
                                key={`${coin.symbol}`}
                                gateway={provider}
                                issuer_account={coinIssuer.name}
                                account={account}
                                deposit_asset={assetUtils.getCleanAssetSymbol(
                                    coin.backingCoinType
                                )}
                                deposit_asset_name={coin.name}
                                deposit_coin_type={coin.backingCoinType.toLowerCase()}
                                deposit_account={coin.depositAccount}
                                deposit_wallet_type={coin.walletType}
                                receive_asset={coin.symbol}
                                receive_coin_type={coin.symbol.toLowerCase()}
                                supports_output_memos={
                                    coin.supportsMemos === true
                                }
                                gate_fee={parseFloat(coin.gateFee || 0)}
                                min_amount={coin.minAmount}
                                asset_precision={coin.precision}
                                action={this.state.action}
                                is_available={coin.isAvailable}
                                /* CryptoBridge */
                                required_confirmations={
                                    coin.requiredConfirmations
                                }
                                deposit_fee_enabled={
                                    coin.depositFeeEnabled === true
                                }
                                deposit_fee_time_frame={
                                    coin.depositFeeTimeframe
                                }
                                deposit_fee_percentage={
                                    coin.depositFeePercentage
                                }
                                deposit_fee_minimum={coin.depositFeeMinimum}
                                deposit_fee_percentage_low_amounts={
                                    coin.depositFeePercentageLowAmounts
                                }
                                coin_info={coin.info}
                            />
                            <label className="left-label">Support</label>
                            <div>
                                <Translate content="cryptobridge.gateway.support_block" />
                                <br />
                                <br />
                                <a
                                    href={"mailto:" + coinIssuer.support}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {coinIssuer.support}
                                </a>
                            </div>
                        </div>

                        {coin && coin.symbol ? (
                            <TransactionWrapper
                                asset={coin.symbol}
                                fromAccount={
                                    isDeposit
                                        ? coinIssuer.id
                                        : this.props.account.get("id")
                                }
                                to={
                                    isDeposit
                                        ? this.props.account.get("id")
                                        : coinIssuer.id
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

export default connect(CryptoBridgeGateway, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
