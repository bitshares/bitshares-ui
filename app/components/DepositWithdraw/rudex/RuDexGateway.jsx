import React from "react";
import RuDexGatewayDepositRequest from "./RuDexGatewayDepositRequest";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import {RecentTransactions, TransactionWrapper} from "components/Account/RecentTransactions";
import Immutable from "immutable";
import cnames from "classnames";
import LoadingIndicator from "../../LoadingIndicator";

class RuDexGateway extends React.Component {
    constructor(props) {
        super();

        this.state = {
            activeCoin: this._getActiveCoin(props, {action: "deposit"}),
            action: props.viewSettings.get(`rudexAction`, "deposit")
        };
    }

    _getActiveCoin(props, state) {
        let cachedCoin = props.viewSettings.get(`activeCoin_rudex_${state.action}`, null);
        let firstTimeCoin = null;
        if (state.action == 'deposit') {
            firstTimeCoin = 'PPY';
        }
        if (state.action == 'withdraw') {
            firstTimeCoin = 'PPY';
        }
        let activeCoin = cachedCoin ? cachedCoin : firstTimeCoin;
        return activeCoin;
    }

    componentWillReceiveProps(nextProps) {
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
        setting[`activeCoin_rudex_${this.state.action}`] = e.target.value;
        SettingsActions.changeViewSetting(setting);
    }

    changeAction(type) {

        let activeCoin = this._getActiveCoin(this.props, {action: type});


        this.setState({
            action: type,
            activeCoin: activeCoin
        });

        SettingsActions.changeViewSetting({[`rudexAction`]: type});
    }

    render() {
        let {coins, account} = this.props;
        let {activeCoin, action} = this.state;

        if (!coins.length) {
            return <LoadingIndicator />;
        }

        let filteredCoins = coins.filter(a => {
            if (!a || !a.symbol) {
                return false;
            } else {
                return action === "deposit" ? a.depositAllowed : a.withdrawalAllowed;
            }
        });

        let coinOptions = filteredCoins.map(coin => {
            let option = action === "deposit" ? coin.backingCoin.toUpperCase() : coin.symbol;
            return <option value={option} key={coin.symbol}>{option}</option>;
        }).filter(a => {
            return a !== null;
        });

        let coin = filteredCoins.filter(coin => {
            return (action === "deposit" ? coin.backingCoin.toUpperCase() === activeCoin : coin.symbol === activeCoin);
        })[0];

        if (!coin) coin = filteredCoins[0];

        let isDeposit = this.state.action === "deposit";


        let supportEmail = "support@rudex.org";

        return (
            <div style={this.props.style}>
                <div className="grid-block no-margin vertical medium-horizontal no-padding">
                    <div className="medium-4">
                        <div>
                            <label style={{minHeight: "2rem"}} className="left-label"><Translate content={"gateway.choose_" + action} />: </label>
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
                        <label style={{minHeight: "2rem"}} className="left-label"><Translate content="gateway.gateway_text" />:</label>
                        <div style={{paddingBottom: 15}}>
                            <ul className="button-group segmented no-margin">
                                <li className={action === "deposit" ? "is-active" : ""}><a onClick={this.changeAction.bind(this, "deposit")}><Translate content="gateway.deposit" /></a></li>
                                <li className={action === "withdraw" ? "is-active" : ""}><a onClick={this.changeAction.bind(this, "withdraw")}><Translate content="gateway.withdraw" /></a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {!coin ? null :
                    <div>


                        <div style={{marginBottom: 15}}>
                            <RuDexGatewayDepositRequest
                                key={`${coin.symbol}`}
                                gateway={coin.gatewayWallet}
                                issuer_account={coin.issuer}
                                account={account}
                                deposit_asset={coin.backingCoin.toUpperCase()}
                                deposit_asset_name={coin.name}
                                deposit_coin_type={coin.backingCoin.toLowerCase()}
                                deposit_account={coin.gatewayWallet}
                                deposit_wallet_type={coin.walletType}
                                receive_asset={coin.symbol}
                                receive_coin_type={coin.symbol.toLowerCase()}
                                supports_output_memos={coin.memoSupport}
                                min_amount={coin.minAmount}
                                asset_precision={coin.precision}
                                action={this.state.action}
                            />
                            <label className="left-label">Support</label>
                            <div><Translate content="gateway.rudex.support_block" /><br /><br /><a href={"mailto:" + supportEmail}>{supportEmail}</a></div>
                        </div>

                        {coin && coin.symbol ?
                            <TransactionWrapper
                                asset={coin.symbol}
                                fromAccount={
                                    isDeposit ? (coin.issuerId) :
                                        this.props.account.get("id")
                                }
                                to={
                                    isDeposit ? ( this.props.account.get("id") ) :
                                        (coin.issuerId)
                                }

                            >
                                { ({asset, to, fromAccount}) => {
                                    return <RecentTransactions
                                        accountsList={Immutable.List([this.props.account.get("id")])}
                                        limit={10}
                                        compactView={true}
                                        fullHeight={true}
                                        filter="transfer"
                                        title={<Translate content={"gateway.recent_" + this.state.action} />}
                                        customFilter={{
                                            fields: ["to", "from", "asset_id"],
                                            values: {
                                                to: to.get("id"),
                                                from: fromAccount.get("id") ,
                                                asset_id: asset.get("id")
                                            }
                                        }}
                                    />;
                                }
                                }
                            </TransactionWrapper> : null}
                    </div>
                }

            </div>
        );
    }


}

export default connect(RuDexGateway, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
