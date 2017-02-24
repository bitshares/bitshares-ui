import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import BalanceComponent from "../Utility/BalanceComponent";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import SettleModal from "../Modal/SettleModal";
import {BalanceValueComponent, EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import AssetName from "../Utility/AssetName";
import CollateralPosition from "../Blockchain/CollateralPosition";
import { RecentTransactions } from "./RecentTransactions";
import Proposals from "components/Account/Proposals";
import {ChainStore} from "bitsharesjs/es";
import SettingsActions from "actions/SettingsActions";
import assetUtils from "common/asset_utils";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import {Link} from "react-router";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import BorrowModal from "../Modal/BorrowModal";
import ReactTooltip from "react-tooltip";
import SimpleDepositWithdraw from "../Dashboard/SimpleDepositWithdraw";
import { fetchCoins, getBackedCoins } from "common/blockTradesMethods";

class AccountOverview extends React.Component {

    static propTypes = {
        balanceAssets: ChainTypes.ChainAssetsList
    };

    constructor() {
        super();
        this.state = {
            settleAsset: "1.3.0",
            showHidden: false,
            depositAsset: null,
            withdrawAsset: null
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps.balanceAssets, this.props.balanceAssets) ||
            !utils.are_equal_shallow(nextProps.openLedgerBackedCoins, this.props.openLedgerBackedCoins) ||
            !utils.are_equal_shallow(nextProps.balances, this.props.balances) ||
            nextProps.account !== this.props.account ||
            nextProps.settings !== this.props.settings ||
            nextProps.hiddenAssets !== this.props.hiddenAssets ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    _onSettleAsset(id, e) {
        e.preventDefault();
        this.setState({
            settleAsset: id
        });

        this.refs.settlement_modal.show();
    }

    _hideAsset(asset, status) {
        SettingsActions.hideAsset(asset, status);
    }

    _showDepositWithdraw(action, asset, fiatModal, e) {
        e.preventDefault();
        console.log("_showDepositWithdraw:", action, asset);
        this.setState({
            [action === "deposit_modal" ? "depositAsset" : "withdrawAsset"]: asset,
            fiatModal
        }, () => {
            this.refs[action].show();
        });
    }

    _getSeparator(render) {
        return render ? <span> | </span> : null;
    }

    _onNavigate(route, e) {
        e.preventDefault();
        this.props.router.push(route);
    }

    _renderBalances(balanceList) {
        let {settings, hiddenAssets, orders} = this.props;
        let preferredUnit = settings.get("unit") || "1.3.0";
        let showAssetPercent = settings.get("showAssetPercent", false);

        let balances = [], openOrders = [];
        balanceList.forEach( balance => {
            let balanceObject = ChainStore.getObject(balance);
            let asset_type = balanceObject.get("asset_type");
            let asset = ChainStore.getObject(asset_type);
            let isBitAsset = asset && asset.has("bitasset_data_id");
            const core_asset = ChainStore.getAsset("1.3.0");

            let assetInfoLinks;
            let marketLink, directMarketLink, settleLink, transferLink, borrowLink, borrowModal;
            let symbol = "";
            if (!asset) return null;

            const assetName = asset.get("symbol");
            const notCore = asset.get("id") !== "1.3.0";
            let {market} = assetUtils.parseDescription(asset.getIn(["options", "description"]));
            symbol = asset.get("symbol");
            let preferredMarket = market ? market : core_asset ? core_asset.get("symbol") : "BTS";

            /* Table content */
            const assetDetailURL = `/asset/${asset.get("symbol")}`;
            const marketURL = `/market/${asset.get("symbol")}_${preferredMarket}`;

            marketLink = notCore ? <a href={marketURL} onClick={this._onNavigate.bind(this, marketURL)}><AssetName name={asset.get("symbol")} /> : <AssetName name={preferredMarket} /></a> : null;
            directMarketLink = notCore ? <Link to={`/market/${asset.get("symbol")}_${preferredMarket}`}><Translate content="account.trade" /></Link> : null;
            transferLink = <Link to={`/transfer?asset=${asset.get("id")}`}><Translate content="transaction.trxTypes.transfer" /></Link>;

            if (isBitAsset) {
                let modalRef = "cp_modal_" + asset.get("id");
                borrowModal = <BorrowModal
                    ref={modalRef}
                    quote_asset={asset.get("id")}
                    backing_asset={asset.getIn(["bitasset", "options", "short_backing_asset"])}
                    account={this.props.account}
                />;

                borrowLink = <a onClick={() => {ReactTooltip.hide();this.refs[modalRef].show();}}><Translate content="exchange.borrow" /></a>;
            }

            /* Popover content */
            settleLink = <a href onClick={this._onSettleAsset.bind(this, asset.get("id"))}>
                <Translate content="account.settle"/></a>;
            assetInfoLinks = (
            <ul>
                <li><a href={assetDetailURL} onClick={this._onNavigate.bind(this, assetDetailURL)}><Translate content="account.asset_details"/></a></li>
                {notCore ? <li>{marketLink}</li> : null}
                {isBitAsset ? <li>{settleLink}</li> : null}
            </ul>);

            const includeAsset = !hiddenAssets.includes(asset_type);
            const hasBalance = !!balanceObject.get("balance");
            const hasOnOrder = !!orders[asset_type];
            const canDepositWithdraw = !!this.props.openLedgerBackedCoins.find(a => a.symbol === asset.get("symbol"));
            const canWithdraw = canDepositWithdraw && (hasBalance && balanceObject.get("balance") != 0);
            let onOrders = hasOnOrder ? <FormattedAsset amount={orders[asset_type]} asset={asset_type} /> : null;

            if (hasOnOrder) {
                let goToLink = <Link to={`/account/${this.props.account.get("name")}/orders`}><Translate content="account.see_open" /></Link>;
                openOrders.push(
                    <tr key={balance} style={{maxWidth: "100rem"}}>
                        <td style={{textAlign: "right"}}>
                            <div className="tooltip" data-place="bottom" data-tip={counterpart.translate("account.in_open", {asset: symbol})} style={{paddingTop: 8}}>{onOrders}</div>
                        </td>
                        <td style={{textAlign: "right"}}>
                            <div className="tooltip" data-place="bottom" data-tip={counterpart.translate("account.in_open_value", {asset: symbol})} style={{paddingTop: 8}}>
                                <EquivalentValueComponent amount={orders[asset_type]} fromAsset={asset_type} noDecimals={true} toAsset={preferredUnit}/>
                            </div>
                        </td>
                        <td colSpan="3" style={{textAlign: "center"}}>
                            {directMarketLink}
                            {directMarketLink ? <span> | </span> : null}
                            {goToLink}
                        </td>
                    </tr>
                );
            }
            balances.push(
                <tr key={balance} style={{maxWidth: "100rem"}}>
                    <td style={{textAlign: "right"}}>
                        {hasBalance || hasOnOrder ? <BalanceComponent balance={balance} assetInfo={assetInfoLinks}/> : null}
                    </td>
                    <td style={{textAlign: "right"}}>
                        {hasBalance || hasOnOrder ? <BalanceValueComponent balance={balance} toAsset={preferredUnit}/> : null}
                    </td>
                    {showAssetPercent ? <td style={{textAlign: "right"}}>
                        {hasBalance ? <BalanceComponent balance={balance} asPercentage={true}/> : null}
                    </td> : null}
                    <td style={{textAlign: "center"}}>
                        {transferLink}
                        {canDepositWithdraw && this.props.isMyAccount? (
                            <span>
                                {this._getSeparator(hasBalance || hasOnOrder)}
                                <a onClick={this._showDepositWithdraw.bind(this, "deposit_modal", assetName, false)}>
                                    <Translate content="gateway.deposit" />
                                </a>
                            </span>
                        ) : null}
                        {canWithdraw && this.props.isMyAccount? (
                            <span>
                                {this._getSeparator(canDepositWithdraw || hasBalance)}
                                <a className={!canWithdraw ? "disabled" : ""} onClick={canWithdraw ? this._showDepositWithdraw.bind(this, "withdraw_modal", assetName, false) : () => {}}>
                                    <Translate content="modal.withdraw.submit" />
                                </a>
                            </span>
                        ) : null}
                    </td>
                    <td style={{textAlign: "center"}}>
                        {directMarketLink}
                        {isBitAsset ? <div className="inline-block" data-place="bottom" data-tip={counterpart.translate("tooltip.borrow", {asset: symbol})}>&nbsp;| {borrowLink}{borrowModal}</div> : null}
                        {isBitAsset ? <div className="inline-block" data-place="bottom" data-tip={counterpart.translate("tooltip.settle", {asset: symbol})}>&nbsp;| {settleLink}</div> : null}
                    </td>
                    <td style={{textAlign: "center"}} className="column-hide-small" data-place="bottom" data-tip={counterpart.translate("tooltip." + (includeAsset ? "hide_asset" : "show_asset"))}>
                        <a style={{marginRight: 0}} className={includeAsset ? "order-cancel" : "action-plus"} onClick={this._hideAsset.bind(this, asset_type, includeAsset)}>
                            <Icon name={includeAsset ? "cross-circle" : "plus-circle"} className="icon-14px" />
                        </a>
                    </td>
                </tr>
            );
        });

        return {balances, openOrders};
    }

    _toggleHiddenAssets() {
        this.setState({
            showHidden: !this.state.showHidden
        });
    }

    render() {
        let {account, hiddenAssets, settings, orders} = this.props;
        let {showHidden} = this.state;

        if (!account) {
            return null;
        }

        let call_orders = [], collateral = 0, debt = {};

        if (account.toJS && account.has("call_orders")) call_orders = account.get("call_orders").toJS();
        let includedBalances, hiddenBalances, includedOrders, hiddenOrders, hasOpenOrders = false;
        let account_balances = account.get("balances");

        let includedBalancesList = Immutable.List(), hiddenBalancesList = Immutable.List();
        call_orders.forEach( (callID) => {
            let position = ChainStore.getObject(callID);
            if (position) {
                collateral += parseInt(position.get("collateral"), 10);

                let debtAsset = position.getIn(["call_price", "quote", "asset_id"]);
                if (!debt[debtAsset]) {
                    debt[debtAsset] = parseInt(position.get("debt"), 10);
                } else {
                    debt[debtAsset] += parseInt(position.get("debt"), 10);
                }
            }
        });

        if (account_balances) {
            // Filter out balance objects that have 0 balance or are not included in open orders
            account_balances = account_balances.filter((a, index) => {
                let balanceObject = ChainStore.getObject(a);
                if (balanceObject && (!balanceObject.get("balance") && !orders[index])) {
                    return false;
                } else {
                    return true;
                }
            });

            // Separate balances into hidden and included
            account_balances.forEach((a, asset_type) => {
                if (hiddenAssets.includes(asset_type)) {
                    hiddenBalancesList = hiddenBalancesList.push(a);
                } else {
                    includedBalancesList = includedBalancesList.push(a);
                }
            });

            let included = this._renderBalances(includedBalancesList);
            includedBalances = included.balances;
            includedOrders = included.openOrders;
            let hidden = this._renderBalances(hiddenBalancesList);
            hiddenBalances = hidden.balances;
            hiddenOrders = hidden.openOrders;

            hasOpenOrders = hiddenOrders.length || includedOrders.length;
        }

        if (hiddenBalances) {
            hiddenBalances.unshift(<tr style={{backgroundColor: "transparent"}} key="hidden"><td style={{height: 20}} colSpan="4"></td></tr>);
        }

        let totalBalanceList = includedBalancesList.concat(hiddenBalancesList);
        let totalBalance = totalBalanceList.size ?
            <TotalBalanceValue
                balances={totalBalanceList}
                openOrders={orders}
                debt={debt}
                collateral={collateral}
            /> : null;

        let showAssetPercent = settings.get("showAssetPercent", false);

        // Find the current Openledger coins
        const currentDepositAsset = this.props.openLedgerBackedCoins.find(c => {
            return c.symbol === this.state.depositAsset;
        }) || {};
        const currentWithdrawAsset = this.props.openLedgerBackedCoins.find(c => {
            return c.symbol === this.state.withdrawAsset;
        }) || {};

        return (
            <div className="grid-content" style={{overflowX: "hidden"}}>
                <div className="content-block small-12">
                    <div className="generic-bordered-box">
                        <div className="block-content-header" style={{position: "relative"}}>
                            <Translate content="transfer.balances" />
                            {hiddenBalances && hiddenBalances.length - 1 > 0 ? <div
                                className="button outline small column-hide-small no-margin"
                                style={{position: "absolute", top: 0, right: 0}}
                                onClick={this._toggleHiddenAssets.bind(this)}
                            >
                                <Translate content={`account.${showHidden ? "hide_hidden" : "show_hidden"}`} /><span> ({hiddenBalances.length - 1})</span>
                            </div> : null}
                        </div>
                        <table className="table">
                            <thead>
                                <tr>
                                    {/*<th><Translate component="span" content="modal.settle.submit" /></th>*/}
                                    <th style={{textAlign: "right"}}><Translate component="span" content="account.asset" /></th>
                                    {/*<<th style={{textAlign: "right"}}><Translate component="span" content="account.bts_market" /></th>*/}
                                    <th style={{textAlign: "right"}}><Translate component="span" content="account.eq_value" /></th>
                                    {showAssetPercent ? <th style={{textAlign: "right"}}><Translate component="span" content="account.percent" /></th> : null}
                                    <th style={{textAlign: "center"}}>
                                        <Translate content="account.transfer_actions" />
                                    </th>
                                    <th style={{textAlign: "center"}}>
                                        <Translate content="account.market_actions" />
                                    </th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {includedBalances}
                                {totalBalanceList.size > 1 ?
                                <tr className="tooltip" data-place="bottom" data-tip={counterpart.translate("account.total_estimate")} style={{backgroundColor: "transparent"}}>
                                    <td colSpan="2" style={{textAlign: "right", fontWeight: "bold", paddingTop: 20}}>
                                        <span><Translate content="account.estimate_value" />: {totalBalance}</span>
                                    </td>
                                </tr> : null}
                                {showHidden ? hiddenBalances : null}

                                {/* Open orders */}
                                {hasOpenOrders ? <tr style={{backgroundColor: "transparent"}}><td style={{height: 20}} colSpan="4"></td></tr> : null}
                                {hasOpenOrders ? <tr style={{backgroundColor: "transparent"}}>
                                    <td colSpan="5" className="no-padding">
                                        <div className="block-content-header">
                                            <Translate content="account.open_orders" />
                                        </div>
                                    </td>
                                </tr>  : null}
                                {includedOrders}
                                {hiddenOrders}
                            </tbody>
                        </table>
                        <SettleModal ref="settlement_modal" asset={this.state.settleAsset} account={account.get("name")}/>
                    </div>
                </div>

                {call_orders.length > 0 ? (

                <div className="content-block">
                    <div className="generic-bordered-box">
                        <div className="block-content-header">
                            <Translate content="account.collaterals" />
                        </div>
                        <CollateralPosition callOrders={call_orders} account={account} />
                    </div>
                </div>) : null}

                {account.get("proposals") && account.get("proposals").size ?
                <div className="content-block">
                    <div className="block-content-header">
                        <Translate content="explorer.proposals.title" account={account.get("id")} />
                    </div>
                    <Proposals account={account.get("id")}/>
                </div> : null}

                <div className="content-block">
                    <RecentTransactions
                        accountsList={Immutable.fromJS([account.get("id")])}
                        compactView={false}
                        showMore={true}
                        fullHeight={true}
                        limit={10}
                        showFilters={true}
                    />
                </div>

                {/* Deposit Modal */}
                <SimpleDepositWithdraw
                    ref="deposit_modal"
                    action="deposit"
                    fiatModal={this.state.fiatModal}
                    account={this.props.account.get("name")}
                    sender={this.props.account.get("id")}
                    asset={this.state.depositAsset}
                    modalId="simple_deposit_modal"
                    balances={this.props.balances}
                    {...currentDepositAsset}
                />

                {/* Withdraw Modal */}
                <SimpleDepositWithdraw
                    ref="withdraw_modal"
                    action="withdraw"
                    fiatModal={this.state.fiatModal}
                    account={this.props.account.get("name")}
                    sender={this.props.account.get("id")}
                    asset={this.state.withdrawAsset}
                    modalId="simple_withdraw_modal"
                    balances={this.props.balances}
                    {...currentWithdrawAsset}
                />
            </div>

        );
    }
}

AccountOverview = BindToChainState(AccountOverview);

class BalanceWrapper extends React.Component {

    static propTypes = {
        balances: ChainTypes.ChainObjectsList,
        orders: ChainTypes.ChainObjectsList
    };

    static defaultProps = {
        balances: Immutable.List(),
        orders: Immutable.List()
    };

    constructor() {
        super();

        this.state = {
            openLedgerCoins: [],
            openLedgerBackedCoins: []
        };
    }

    componentWillMount() {
        fetchCoins().then(result => {
            this.setState({
                openLedgerCoins: result,
                openLedgerBackedCoins: getBackedCoins({allCoins: result, backer: "OPEN"})
            });
        });
    }

    render() {
        let balanceAssets = this.props.balances.map(b => {
            return b && b.get("asset_type");
        }).filter(b => !!b);

        let ordersByAsset = this.props.orders.reduce((orders, o) => {
            let asset_id = o.getIn(["sell_price", "base", "asset_id"]);
            if (!orders[asset_id]) orders[asset_id] = 0;
            orders[asset_id] += parseInt(o.get("for_sale"), 10);
            return orders;
        }, {});

        for (let id in ordersByAsset) {
            if (balanceAssets.indexOf(id) === -1) {
                balanceAssets.push(id);
            }
        }

        return (
            <AccountOverview {...this.state} {...this.props} orders={ordersByAsset} balanceAssets={Immutable.List(balanceAssets)} />
        );
    };
}

export default BindToChainState(BalanceWrapper);
