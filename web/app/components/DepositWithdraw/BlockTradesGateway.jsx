import React from "react";
import BlockTradesGatewayDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesGatewayDepositRequest";
import Translate from "react-translate-component";
import { connect } from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import { RecentTransactions, TransactionWrapper } from "components/Account/RecentTransactions";
import Immutable from "immutable";
import cnames from "classnames";
import LoadingIndicator from "../LoadingIndicator";

class BlockTradesGateway extends React.Component {
    constructor(props) {
        super();

        this.state = {
            activeCoin: this._getActiveCoin(props, {action: "deposit"}),
            action: props.viewSettings.get(`${props.provider}Action`, "deposit")
        };
    }

    _getActiveCoin(props, state) {
        let cachedCoin = props.viewSettings.get(`activeCoin_${props.provider}_${state.action}`, null);
		let firstTimeCoin = null;
		if ((props.provider == 'blocktrades') && (state.action == 'deposit')) {
			firstTimeCoin = 'BTC';
		}
		if ((props.provider == 'openledger') && (state.action == 'deposit')) {
			firstTimeCoin = 'BTC';
		}
		if ((props.provider == 'blocktrades') && (state.action == 'withdraw')) {
			firstTimeCoin = 'TRADE.BTC';
		}
		if ((props.provider == 'openledger') && (state.action == 'withdraw')) {
			firstTimeCoin = 'OPEN.BTC';
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
        setting[`activeCoin_${this.props.provider}_${this.state.action}`] = e.target.value;
        SettingsActions.changeViewSetting(setting);
    }

    changeAction(type) {

        let activeCoin = this._getActiveCoin(this.props, {action: type});


        this.setState({
            action: type,
            activeCoin: activeCoin
        });

        SettingsActions.changeViewSetting({[`${this.props.provider}Action`]: type});
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
                return true;
            }
        });

        let coinOptions = filteredCoins.map(coin => {
            let option = action === "deposit" ? coin.backingCoinType.toUpperCase() : coin.symbol;
            return <option value={option} key={coin.symbol}>{option}</option>;
        }).filter(a => {
            return a !== null;
        });

        let coin = filteredCoins.filter(coin => {
            return (action === "deposit" ? coin.backingCoinType.toUpperCase() === activeCoin : coin.symbol === activeCoin);
        })[0];

        if (!coin) coin = filteredCoins[0];

        let issuers = {
            blocktrades: {name: "blocktrades", id: "1.2.32567", support: "support@blocktrades.us"},
            openledger: {name: "openledger-wallet", id: "1.2.96397", support: "opensupport@blocktrades.us"}
        };

        let issuer = issuers[provider];

        let isDeposit = this.state.action === "deposit";

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
                        <label style={{minHeight: "2rem"}} className="left-label"><Translate content="gateway.gateway_text" /></label>
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
                        <BlockTradesGatewayDepositRequest
                            key={`${provider}.${coin.symbol}`}
                            gateway={provider}
                            issuer_account={issuer.name}
                            account={account}
                            deposit_asset={coin.backingCoinType.toUpperCase()}
                            deposit_asset_name={coin.name}
                            deposit_coin_type={coin.backingCoinType.toLowerCase()}
                            deposit_account={coin.depositAccount}
                            deposit_wallet_type={coin.walletType}
                            receive_asset={coin.symbol}
                            receive_coin_type={coin.symbol.toLowerCase()}
                            supports_output_memos={coin.supportsMemos}
                            action={this.state.action}
                        />
                        <label className="left-label">Support</label>
                        <div><Translate content="gateway.support_block" /><br /><br /><a href={"mailto:" + issuer.support}>{issuer.support}</a></div>
                    </div>

                    {coin && coin.symbol ?
                    <TransactionWrapper
                        asset={coin.symbol}
                        fromAccount={
                            isDeposit ? (issuer.id) :
                            this.props.account.get("id")
                        }
                        to={
                            isDeposit ? ( this.props.account.get("id") ) :
                            (issuer.id)
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
        )
    }
}

export default connect(BlockTradesGateway, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
