import React from "react";
import BlockTradesGatewayDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesGatewayDepositRequest";
import Translate from "react-translate-component";
import AccountBalance from "components/Account/AccountBalance";
import connectToStores from "alt/utils/connectToStores";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import RecentTransactions from "components/Account/RecentTransactions";
import Immutable from "immutable";
import cnames from "classnames";
import AssetName from "components/Utility/AssetName";
import assetUtils from "common/asset_utils";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import LoadingIndicator from "../LoadingIndicator";

@connectToStores
export default class BlockTradesGateway extends React.Component {

    static getStores() {
        return [SettingsStore]
    };

    static getPropsFromStores() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        }
    };

    constructor(props) {
        super();

        this.state = {
            activeCoin: this._getActiveCoin(props, {action: "deposit"}),
            action: "deposit"
        };
    }

    _getActiveCoin(props, state) {
        let cachedCoin = props.viewSettings.get(`activeCoin_${props.provider}_${state.action}`, null);
        let activeCoin = cachedCoin ? cachedCoin : props.coins.length ? props.coins[0][state.action === "withdraw" ? "symbol" : "backingCoinType"].toUpperCase() : null;
        return activeCoin;
    }

    componentWillReceiveProps(nextProps, nextState) {
        if (nextProps.provider !== this.props.provider) {
            this.setState({
                activeCoin: this._getActiveCoin(nextProps, this.state.action)
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.action !== this.state.action) {
            this.setState({
                activeCoin: this._getActiveCoin(nextProps, nextState)
            });
        }

        return true;
    }

    onSelectCoin(e) {
        this.setState({
            activeCoin: e.target.value
        });

        let setting = {};
        setting[`activeCoin_${this.props.provider}_${this.state.action}`] = e.target.value;
        SettingsActions.changeViewSetting(setting);
    }

    changeAction(type) {
        this.setState({
            action: type
        });
    }

    render() {
        let {coins, account, provider} = this.props;
        let {activeCoin, action} = this.state;

        if (!coins.length) {
            return <LoadingIndicator />;
        }

        let coinOptions = coins.map(coin => {
            let option = action === "deposit" ? coin.backingCoinType.toUpperCase() : coin.symbol;
            return <option value={option} key={coin.symbol}>{option}</option>;
        });

        let coin = coins.filter(coin => {
            return (action === "withdraw" ? coin.symbol : coin.backingCoinType.toUpperCase()) === activeCoin;
        })[0];

        let issuers = {
            blocktrades: {name: "blocktrades", id: "1.2.32567"},
            openledger: {name: "openledger-wallet", id: "1.2.96397"}
        };

        let issuer = issuers[provider];

        let isDeposit = this.state.action === "deposit";

        return (

            <div style={this.props.style}>

                <div style={{paddingBottom: 15}}>
                    <div style={{marginRight: 10}} onClick={this.changeAction.bind(this, "deposit")} className={cnames("button", action === "deposit" ? "active" : "outline")}><Translate content="gateway.deposit" /></div>
                    <div onClick={this.changeAction.bind(this, "withdraw")} className={cnames("button", action === "withdraw" ? "active" : "outline")}><Translate content="gateway.withdraw" /></div>
                </div>
                {!coin ? <LoadingIndicator /> :
                <div>    
                    <div>
                        <span><Translate content={"gateway.choose_" + action} />: </span>
                        <select
                            style={{
                                marginLeft: 5,
                                display: "inline",
                                maxWidth: "15rem"
                            }}
                            className="external-coin-types"
                            onChange={this.onSelectCoin.bind(this)}
                            value={activeCoin}
                        >
                            {coinOptions}
                        </select>
                    </div>

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
                            deposit_memo_name={coin.memo}
                            action={this.state.action}
                        />
                        <div style={{padding: 15}}><Translate content="gateway.support_block" /> <a href="mail:support@blocktrades.us">support@blocktrades.us</a></div>
                    </div>

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
                            />
                            }
                        }
                    </TransactionWrapper>
                </div>
                }
            </div>
        )
    }
}

@BindToChainState()
class TransactionWrapper extends React.Component {

    static propTypes = {
        asset: ChainTypes.ChainAsset.isRequired,
        to: ChainTypes.ChainAccount.isRequired,
        fromAccount: ChainTypes.ChainAccount.isRequired
    };

    render() {
        return <span className="wrapper">{this.props.children(this.props)}</span>;
    }

}
