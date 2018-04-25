import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import BalanceComponent from "../Utility/BalanceComponent";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import SettleModal from "../Modal/SettleModal";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import {Market24HourChangeComponent} from "../Utility/MarketChangeComponent";
import AssetName from "../Utility/AssetName";
import MarginPositions from "./MarginPositions";
import {RecentTransactions} from "./RecentTransactions";
import Proposals from "components/Account/Proposals";
import {ChainStore} from "bitsharesjs/es";
import SettingsActions from "actions/SettingsActions";
import assetUtils from "common/asset_utils";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import {Link} from "react-router/es";
import EquivalentPrice from "../Utility/EquivalentPrice";
import LinkToAssetById from "../Utility/LinkToAssetById";
import utils from "common/utils";
import BorrowModal from "../Modal/BorrowModal";
import DepositModal from "../Modal/DepositModal";
import ReactTooltip from "react-tooltip";
import SimpleDepositWithdraw from "../Dashboard/SimpleDepositWithdraw";
import SimpleDepositBlocktradesBridge from "../Dashboard/SimpleDepositBlocktradesBridge";
import {Tabs, Tab} from "../Utility/Tabs";
import AccountOrders from "./AccountOrders";
import cnames from "classnames";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import {checkMarginStatus} from "common/accountHelper";
import BalanceWrapper from "./BalanceWrapper";
import SendModal from "../Modal/SendModal";
import PulseIcon from "../Icon/PulseIcon";
import WithdrawModal from "../Modal/WithdrawModalNew";
import AccountTreemap from "./AccountTreemap";
import {getBackedCoin} from "common/gatewayUtils";
import AssetWrapper from "../Utility/AssetWrapper";

class AccountOverview extends React.Component {
    constructor(props) {
        super();
        this.state = {
            sortKey: props.viewSettings.get("portfolioSort", "totalValue"),
            sortDirection: props.viewSettings.get(
                "portfolioSortDirection",
                true
            ), // alphabetical A -> B, numbers high to low
            settleAsset: "1.3.0",
            shownAssets: props.viewSettings.get("shownAssets", "active"),
            depositAsset: null,
            withdrawAsset: null,
            bridgeAsset: null,
            alwaysShowAssets: [
                "BTS"
                // "USD",
                // "CNY",
                // "OPEN.BTC",
                // "OPEN.USDT",
                // "OPEN.ETH",
                // "OPEN.MAID",
                // "OPEN.STEEM",
                // "OPEN.DASH"
            ]
        };

        this.qtyRefs = {};
        this.priceRefs = {};
        this.valueRefs = {};
        this.changeRefs = {};
        for (let key in this.sortFunctions) {
            this.sortFunctions[key] = this.sortFunctions[key].bind(this);
        }

        this._handleFilterInput = this._handleFilterInput.bind(this);
    }

    _handleFilterInput(e) {
        e.preventDefault();
        this.setState({
            filterValue: e.target.value
        });
    }

    sortFunctions = {
        qty: function(a, b, force) {
            if (Number(this.qtyRefs[a.key]) < Number(this.qtyRefs[b.key]))
                return this.state.sortDirection || force ? -1 : 1;

            if (Number(this.qtyRefs[a.key]) > Number(this.qtyRefs[b.key]))
                return this.state.sortDirection || force ? 1 : -1;
        },
        alphabetic: function(a, b, force) {
            if (a.key > b.key)
                return this.state.sortDirection || force ? 1 : -1;
            if (a.key < b.key)
                return this.state.sortDirection || force ? -1 : 1;
            return 0;
        },
        priceValue: function(a, b) {
            let aRef = this.priceRefs[a.key];
            let bRef = this.priceRefs[b.key];
            if (aRef && bRef) {
                let aPrice = aRef.getFinalPrice(true);
                let bPrice = bRef.getFinalPrice(true);
                if (!aPrice && bPrice) return 1;
                if (aPrice && !bPrice) return -1;
                if (!aPrice && !bPrice)
                    return this.sortFunctions.alphabetic(a, b, true);
                return this.state.sortDirection
                    ? aPrice - bPrice
                    : bPrice - aPrice;
            }
        },
        totalValue: function(a, b) {
            let aRef = this.valueRefs[a.key];
            let bRef = this.valueRefs[b.key];
            if (aRef && bRef) {
                let aValue = aRef.getValue();
                let bValue = bRef.getValue();
                if (!aValue && bValue) return 1;
                if (aValue && !bValue) return -1;
                if (!aValue && !bValue)
                    return this.sortFunctions.alphabetic(a, b, true);
                return this.state.sortDirection
                    ? aValue - bValue
                    : bValue - aValue;
            }
        },
        changeValue: function(a, b) {
            let aRef = this.changeRefs[a.key];
            let bRef = this.changeRefs[b.key];

            if (aRef && bRef) {
                let aValue = aRef.getValue();
                let bValue = bRef.getValue();
                let aChange =
                    parseFloat(aValue) != "NaN" ? parseFloat(aValue) : aValue;
                let bChange =
                    parseFloat(bValue) != "NaN" ? parseFloat(bValue) : bValue;
                let direction =
                    typeof this.state.sortDirection !== "undefined"
                        ? this.state.sortDirection
                        : true;

                return direction ? aChange - bChange : bChange - aChange;
            }
        }
    };

    componentWillMount() {
        this._checkMarginStatus();
    }

    _checkMarginStatus(props = this.props) {
        checkMarginStatus(props.account).then(status => {
            let globalMarginStatus = null;
            for (let asset in status) {
                globalMarginStatus =
                    status[asset].statusClass || globalMarginStatus;
            }
            this.setState({globalMarginStatus});
        });
    }

    componentWillReceiveProps(np) {
        if (np.account !== this.props.account) {
            this._checkMarginStatus(np);
            this.priceRefs = {};
            this.valueRefs = {};
            this.changeRefs = {};
            setTimeout(this.forceUpdate.bind(this), 500);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(
                nextProps.balanceAssets,
                this.props.balanceAssets
            ) ||
            !utils.are_equal_shallow(
                nextProps.backedCoins,
                this.props.backedCoins
            ) ||
            !utils.are_equal_shallow(nextProps.balances, this.props.balances) ||
            nextProps.account !== this.props.account ||
            nextProps.settings !== this.props.settings ||
            nextProps.hiddenAssets !== this.props.hiddenAssets ||
            !utils.are_equal_shallow(nextState, this.state) ||
            this.state.filterValue !== nextState.filterValue
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

    _showDepositModal(asset, e) {
        e.preventDefault();
        this.setState({depositAsset: asset}, () => {
            this.refs.deposit_modal_new.show();
        });
    }

    _showDepositWithdraw(action, asset, fiatModal, e) {
        e.preventDefault();
        this.setState(
            {
                [action === "bridge_modal"
                    ? "bridgeAsset"
                    : action === "deposit_modal"
                        ? "depositAsset"
                        : "withdrawAsset"]: asset,
                fiatModal
            },
            () => {
                this.refs[action].show();
            }
        );
    }

    _getSeparator(render) {
        return render ? <span>&nbsp;|&nbsp;</span> : null;
    }

    _onNavigate(route, e) {
        e.preventDefault();
        this.props.router.push(route);
    }

    triggerSend(asset) {
        this.setState({send_asset: asset}, () => {
            if (this.send_modal) this.send_modal.show();
        });
    }

    _renderBuy = (symbol, canBuy, assetName, emptyCell, balance) => {
        if (symbol === "BTS" && balance <= 100000) {
            // Precision of 5, 1 = 10^5
            return (
                <span>
                    <a
                        onClick={this._showDepositWithdraw.bind(
                            this,
                            "bridge_modal",
                            assetName,
                            false
                        )}
                    >
                        <PulseIcon
                            onIcon="dollar"
                            offIcon="dollar-green"
                            duration={1000}
                            className="icon-14px"
                        />
                    </a>
                </span>
            );
        } else {
            return canBuy && this.props.isMyAccount ? (
                <span>
                    <a
                        onClick={this._showDepositWithdraw.bind(
                            this,
                            "bridge_modal",
                            assetName,
                            false
                        )}
                    >
                        <Icon name="dollar" className="icon-14px" />
                    </a>
                </span>
            ) : (
                emptyCell
            );
        }
    };

    _renderBalances(balanceList, optionalAssets, visible) {
        const {core_asset} = this.props;
        let {settings, hiddenAssets, orders} = this.props;
        let preferredUnit = settings.get("unit") || core_asset.get("symbol");
        let showAssetPercent = settings.get("showAssetPercent", false);

        const renderBorrow = (asset, account) => {
            let isBitAsset = asset && asset.has("bitasset_data_id");
            let modalRef = "cp_modal_" + asset.get("id");
            return {
                isBitAsset,
                borrowModal: !isBitAsset ? null : (
                    <BorrowModal
                        ref={modalRef}
                        modalId={"borrow_modal_" + asset.get("id")}
                        quote_asset={asset.get("id")}
                        backing_asset={asset.getIn([
                            "bitasset",
                            "options",
                            "short_backing_asset"
                        ])}
                        account={account}
                    />
                ),
                borrowLink: !isBitAsset ? null : (
                    <a
                        onClick={() => {
                            ReactTooltip.hide();
                            this.refs[modalRef].show();
                        }}
                    >
                        <Icon name="dollar" className="icon-14px" />
                    </a>
                )
            };
        };

        let balances = [];
        const emptyCell = "-";
        balanceList.forEach(balance => {
            let balanceObject = ChainStore.getObject(balance);
            if (!balanceObject) return;
            let asset_type = balanceObject.get("asset_type");
            let asset = ChainStore.getObject(asset_type);
            if (!asset) return;

            let directMarketLink, settleLink, transferLink;
            let symbol = "";

            const assetName = asset.get("symbol");
            const notCore = asset.get("id") !== "1.3.0";
            const notCorePrefUnit = preferredUnit !== core_asset.get("symbol");

            let {market} = assetUtils.parseDescription(
                asset.getIn(["options", "description"])
            );
            symbol = asset.get("symbol");
            if (symbol.indexOf("OPEN.") !== -1 && !market) market = "USD";
            let preferredMarket = market ? market : preferredUnit;

            if (notCore && preferredMarket === symbol)
                preferredMarket = core_asset.get("symbol");

            /* Table content */
            directMarketLink = notCore ? (
                <Link to={`/market/${asset.get("symbol")}_${preferredMarket}`}>
                    <Icon name="trade" className="icon-14px" />
                </Link>
            ) : notCorePrefUnit ? (
                <Link to={`/market/${asset.get("symbol")}_${preferredUnit}`}>
                    <Icon name="trade" className="icon-14px" />
                </Link>
            ) : (
                emptyCell
            );
            transferLink = (
                <a onClick={this.triggerSend.bind(this, asset.get("id"))}>
                    <Icon name="transfer" className="icon-14px" />
                </a>
            );

            let {isBitAsset, borrowModal, borrowLink} = renderBorrow(
                asset,
                this.props.account
            );

            /* Popover content */
            settleLink = (
                <a
                    href
                    onClick={this._onSettleAsset.bind(this, asset.get("id"))}
                >
                    <Icon name="settle" className="icon-14px" />
                </a>
            );

            const includeAsset = !hiddenAssets.includes(asset_type);
            const hasBalance = !!balanceObject.get("balance");
            const hasOnOrder = !!orders[asset_type];

            const backedCoin = getBackedCoin(
                asset.get("symbol"),
                this.props.backedCoins
            );
            const canDeposit =
                (backedCoin && backedCoin.depositAllowed) ||
                asset.get("symbol") == "BTS";

            const canWithdraw =
                backedCoin &&
                backedCoin.withdrawalAllowed &&
                (hasBalance && balanceObject.get("balance") != 0);
            const canBuy = !!this.props.bridgeCoins.get(symbol);

            const assetAmount = balanceObject.get("balance");

            this.qtyRefs[asset.get("symbol")] = utils.get_asset_amount(
                assetAmount,
                asset
            );

            balances.push(
                <tr key={asset.get("symbol")} style={{maxWidth: "100rem"}}>
                    <td style={{textAlign: "left"}}>
                        <LinkToAssetById asset={asset.get("id")} />
                    </td>
                    <td style={{textAlign: "right"}}>
                        {hasBalance || hasOnOrder ? (
                            <BalanceComponent balance={balance} hide_asset />
                        ) : null}
                    </td>
                    <td
                        style={{textAlign: "right"}}
                        className="column-hide-small"
                    >
                        <EquivalentPrice
                            refCallback={c => {
                                if (c && c.refs.bound_component)
                                    this.priceRefs[asset.get("symbol")] =
                                        c.refs.bound_component;
                            }}
                            fromAsset={asset.get("id")}
                            pulsate={{reverse: true, fill: "forwards"}}
                            hide_symbols
                        />
                    </td>
                    <td
                        style={{textAlign: "right"}}
                        className="column-hide-small"
                    >
                        <Market24HourChangeComponent
                            refCallback={c => {
                                if (c && c.refs.bound_component)
                                    this.changeRefs[asset.get("symbol")] =
                                        c.refs.bound_component;
                            }}
                            base={asset.get("id")}
                            quote={preferredUnit}
                            marketId={asset.get("symbol") + "_" + preferredUnit}
                            hide_symbols
                        />
                    </td>
                    <td
                        style={{textAlign: "right"}}
                        className="column-hide-small"
                    >
                        {hasBalance || hasOnOrder ? (
                            <BalanceValueComponent
                                balance={balance}
                                toAsset={preferredUnit}
                                hide_asset
                                refCallback={c => {
                                    if (c && c.refs.bound_component)
                                        this.valueRefs[asset.get("symbol")] =
                                            c.refs.bound_component;
                                }}
                            />
                        ) : null}
                    </td>
                    {showAssetPercent ? (
                        <td style={{textAlign: "right"}}>
                            {hasBalance ? (
                                <BalanceComponent
                                    balance={balance}
                                    asPercentage={true}
                                />
                            ) : null}
                        </td>
                    ) : null}
                    <td>{transferLink}</td>
                    <td>
                        {this._renderBuy(
                            asset.get("symbol"),
                            canBuy,
                            assetName,
                            emptyCell,
                            balanceObject.get("balance")
                        )}
                    </td>
                    <td>
                        {canDeposit && this.props.isMyAccount ? (
                            <span>
                                <Icon
                                    style={{cursor: "pointer"}}
                                    name="deposit"
                                    className="icon-14x"
                                    onClick={this._showDepositModal.bind(
                                        this,
                                        assetName
                                    )}
                                />
                            </span>
                        ) : (
                            emptyCell
                        )}
                    </td>
                    <td>
                        {canWithdraw && this.props.isMyAccount ? (
                            <span>
                                <a
                                    className={!canWithdraw ? "disabled" : ""}
                                    onClick={
                                        canWithdraw
                                            ? this._showDepositWithdraw.bind(
                                                  this,
                                                  "withdraw_modal_new",
                                                  assetName,
                                                  false
                                              )
                                            : () => {}
                                    }
                                >
                                    <Icon
                                        name="withdraw"
                                        className="icon-14px"
                                    />
                                </a>
                            </span>
                        ) : (
                            emptyCell
                        )}
                    </td>
                    <td>{directMarketLink}</td>
                    <td>
                        {isBitAsset ? (
                            <div
                                className="inline-block"
                                data-place="bottom"
                                data-tip={counterpart.translate(
                                    "tooltip.borrow",
                                    {asset: symbol}
                                )}
                            >
                                {borrowLink}
                                {borrowModal}
                            </div>
                        ) : (
                            emptyCell
                        )}
                    </td>
                    <td>
                        {isBitAsset ? (
                            <div
                                className="inline-block"
                                data-place="bottom"
                                data-tip={counterpart.translate(
                                    "tooltip.settle",
                                    {asset: symbol}
                                )}
                            >
                                {settleLink}
                            </div>
                        ) : (
                            emptyCell
                        )}
                    </td>
                    <td
                        style={{textAlign: "center"}}
                        className="column-hide-small"
                        data-place="bottom"
                        data-tip={counterpart.translate(
                            "tooltip." +
                                (includeAsset ? "hide_asset" : "show_asset")
                        )}
                    >
                        <a
                            style={{marginRight: 0}}
                            className={
                                includeAsset ? "order-cancel" : "action-plus"
                            }
                            onClick={this._hideAsset.bind(
                                this,
                                asset_type,
                                includeAsset
                            )}
                        >
                            <Icon
                                name={
                                    includeAsset
                                        ? "cross-circle"
                                        : "plus-circle"
                                }
                                className="icon-14px"
                            />
                        </a>
                    </td>
                </tr>
            );
        });

        if (optionalAssets) {
            optionalAssets
                .filter(asset => {
                    let isAvailable = false;
                    this.props.backedCoins.get("OPEN", []).forEach(coin => {
                        if (coin && coin.symbol === asset) {
                            isAvailable = true;
                        }
                    });
                    if (!!this.props.bridgeCoins.get(asset)) {
                        isAvailable = true;
                    }
                    let keep = true;
                    balances.forEach(a => {
                        if (a.key === asset) keep = false;
                    });
                    return keep && isAvailable;
                })
                .forEach(a => {
                    let asset = ChainStore.getAsset(a);
                    if (asset && this.props.isMyAccount) {
                        const includeAsset = !hiddenAssets.includes(
                            asset.get("id")
                        );

                        const thisAssetName = asset.get("symbol").split(".");
                        const canDeposit =
                            !!this.props.backedCoins
                                .get("OPEN", [])
                                .find(
                                    a => a.backingCoinType === thisAssetName[1]
                                ) ||
                            !!this.props.backedCoins
                                .get("RUDEX", [])
                                .find(
                                    a => a.backingCoin === thisAssetName[1]
                                ) ||
                            asset.get("symbol") == "BTS";

                        const canBuy = !!this.props.bridgeCoins.get(
                            asset.get("symbol")
                        );

                        const notCore = asset.get("id") !== "1.3.0";
                        let {market} = assetUtils.parseDescription(
                            asset.getIn(["options", "description"])
                        );
                        if (
                            asset.get("symbol").indexOf("OPEN.") !== -1 &&
                            !market
                        )
                            market = "USD";
                        let preferredMarket = market
                            ? market
                            : core_asset ? core_asset.get("symbol") : "BTS";
                        let directMarketLink = notCore ? (
                            <Link
                                to={`/market/${asset.get(
                                    "symbol"
                                )}_${preferredMarket}`}
                            >
                                <Icon name="trade" className="icon-14px" />
                            </Link>
                        ) : (
                            emptyCell
                        );
                        let {
                            isBitAsset,
                            borrowModal,
                            borrowLink
                        } = renderBorrow(asset, this.props.account);
                        if (
                            (includeAsset && visible) ||
                            (!includeAsset && !visible)
                        )
                            balances.push(
                                <tr
                                    key={asset.get("symbol")}
                                    style={{maxWidth: "100rem"}}
                                >
                                    <td style={{textAlign: "left"}}>
                                        <LinkToAssetById
                                            asset={asset.get("id")}
                                        />
                                    </td>
                                    <td>{emptyCell}</td>
                                    <td className="column-hide-small">
                                        {emptyCell}
                                    </td>
                                    <td className="column-hide-small">
                                        {emptyCell}
                                    </td>
                                    <td className="column-hide-small">
                                        {emptyCell}
                                    </td>
                                    <td>{emptyCell}</td>
                                    <td style={{textAlign: "center"}}>
                                        {canBuy && this.props.isMyAccount ? (
                                            <span>
                                                <a
                                                    onClick={this._showDepositWithdraw.bind(
                                                        this,
                                                        "bridge_modal",
                                                        a,
                                                        false
                                                    )}
                                                >
                                                    <Icon
                                                        name="dollar"
                                                        className="icon-14px"
                                                    />
                                                </a>
                                            </span>
                                        ) : (
                                            emptyCell
                                        )}
                                    </td>
                                    <td>
                                        {canDeposit &&
                                        this.props.isMyAccount ? (
                                            <span>
                                                <Icon
                                                    style={{cursor: "pointer"}}
                                                    name="deposit"
                                                    className="icon-14x"
                                                    onClick={this._showDepositModal.bind(
                                                        this,
                                                        asset.get("symbol")
                                                    )}
                                                />
                                            </span>
                                        ) : (
                                            emptyCell
                                        )}
                                    </td>
                                    <td>{emptyCell}</td>
                                    <td style={{textAlign: "center"}}>
                                        {directMarketLink}
                                    </td>
                                    <td>
                                        {isBitAsset ? (
                                            <div
                                                className="inline-block"
                                                data-place="bottom"
                                                data-tip={counterpart.translate(
                                                    "tooltip.borrow",
                                                    {asset: asset.get("symbol")}
                                                )}
                                            >
                                                {borrowLink}
                                                {borrowModal}
                                            </div>
                                        ) : (
                                            emptyCell
                                        )}
                                    </td>
                                    <td>{emptyCell}</td>
                                    <td
                                        style={{textAlign: "center"}}
                                        className="column-hide-small"
                                        data-place="bottom"
                                        data-tip={counterpart.translate(
                                            "tooltip." +
                                                (includeAsset
                                                    ? "hide_asset"
                                                    : "show_asset")
                                        )}
                                    >
                                        <a
                                            style={{marginRight: 0}}
                                            className={
                                                includeAsset
                                                    ? "order-cancel"
                                                    : "action-plus"
                                            }
                                            onClick={this._hideAsset.bind(
                                                this,
                                                asset.get("id"),
                                                includeAsset
                                            )}
                                        >
                                            <Icon
                                                name={
                                                    includeAsset
                                                        ? "cross-circle"
                                                        : "plus-circle"
                                                }
                                                className="icon-14px"
                                            />
                                        </a>
                                    </td>
                                </tr>
                            );
                    }
                });
        }

        balances.sort(this.sortFunctions[this.state.sortKey]);
        return balances;
    }

    _changeShownAssets(shownAssets = "active") {
        this.setState({
            shownAssets
        });
        SettingsActions.changeViewSetting({
            shownAssets
        });
    }

    _toggleSortOrder(key) {
        if (this.state.sortKey === key) {
            SettingsActions.changeViewSetting({
                portfolioSortDirection: !this.state.sortDirection
            });
            this.setState({
                sortDirection: !this.state.sortDirection
            });
        } else {
            SettingsActions.changeViewSetting({
                portfolioSort: key
            });
            this.setState({
                sortDirection: false,
                sortKey: key
            });
        }
    }

    render() {
        let {account, hiddenAssets, settings, orders} = this.props;
        let {shownAssets} = this.state;

        if (!account) {
            return null;
        }

        let call_orders = [],
            collateral = {},
            debt = {};

        if (account.toJS && account.has("call_orders"))
            call_orders = account.get("call_orders").toJS();
        let includedBalances, hiddenBalances;
        let account_balances = account.get("balances");

        let includedBalancesList = Immutable.List(),
            hiddenBalancesList = Immutable.List();
        call_orders.forEach(callID => {
            let position = ChainStore.getObject(callID);
            if (position) {
                let collateralAsset = position.getIn([
                    "call_price",
                    "base",
                    "asset_id"
                ]);
                if (!collateral[collateralAsset]) {
                    collateral[collateralAsset] = parseInt(
                        position.get("collateral"),
                        10
                    );
                } else {
                    collateral[collateralAsset] += parseInt(
                        position.get("collateral"),
                        10
                    );
                }
                let debtAsset = position.getIn([
                    "call_price",
                    "quote",
                    "asset_id"
                ]);
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
                if (
                    balanceObject &&
                    (!balanceObject.get("balance") && !orders[index])
                ) {
                    return false;
                } else {
                    return true;
                }
            });

            // Separate balances into hidden and included
            account_balances.forEach((a, asset_type) => {
                const asset = ChainStore.getAsset(asset_type);

                let assetName = "";
                let filter = "";

                if (this.state.filterValue) {
                    filter = this.state.filterValue
                        ? String(this.state.filterValue).toLowerCase()
                        : "";
                    assetName = asset.get("symbol").toLowerCase();
                    let {isBitAsset} = utils.replaceName(asset);
                    if (isBitAsset) {
                        assetName = "bit" + assetName;
                    }
                }

                if (
                    hiddenAssets.includes(asset_type) &&
                    assetName.includes(filter)
                ) {
                    hiddenBalancesList = hiddenBalancesList.push(a);
                } else if (assetName.includes(filter)) {
                    includedBalancesList = includedBalancesList.push(a);
                }
            });

            let included = this._renderBalances(
                includedBalancesList,
                !this.state.filterValue ? this.state.alwaysShowAssets : null,
                true
            );
            includedBalances = included;
            let hidden = this._renderBalances(
                hiddenBalancesList,
                !this.state.filterValue ? this.state.alwaysShowAsset : null
            );
            hiddenBalances = hidden;
        }

        let portfolioHiddenAssetsBalance = (
            <TotalBalanceValue noTip balances={hiddenBalancesList} hide_asset />
        );

        let portfolioActiveAssetsBalance = (
            <TotalBalanceValue
                noTip
                balances={includedBalancesList}
                hide_asset
            />
        );
        let ordersValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                openOrders={orders}
                hide_asset
            />
        );
        let marginValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                debt={debt}
                collateral={collateral}
                hide_asset
            />
        );
        let debtValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                debt={debt}
                hide_asset
            />
        );
        let collateralValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                collateral={collateral}
                hide_asset
            />
        );

        const preferredUnit =
            settings.get("unit") || this.props.core_asset.get("symbol");
        const totalValueText = (
            <TranslateWithLinks
                noLink
                string="account.total"
                keys={[{type: "asset", value: preferredUnit, arg: "asset"}]}
            />
        );

        includedBalances.push(
            <tr key="portfolio" className="total-value">
                <td colSpan="2" style={{textAlign: "left"}}>
                    {totalValueText}
                </td>
                <td className="column-hide-small" />
                <td className="column-hide-small" />
                <td style={{textAlign: "right"}}>
                    {portfolioActiveAssetsBalance}
                </td>
                <td colSpan="9" />
            </tr>
        );

        hiddenBalances.push(
            <tr key="portfolio" className="total-value">
                <td colSpan="2" style={{textAlign: "left"}}>
                    {totalValueText}
                </td>
                <td className="column-hide-small" />
                <td className="column-hide-small" />
                <td style={{textAlign: "right"}}>
                    {portfolioHiddenAssetsBalance}
                </td>
                <td colSpan="9" />
            </tr>
        );

        let showAssetPercent = settings.get("showAssetPercent", false);

        // Find the current Openledger coins
        // const currentDepositAsset = this.props.backedCoins.get("OPEN", []).find(c => {
        //     return c.symbol === this.state.depositAsset;
        // }) || {};
        const currentWithdrawAsset =
            this.props.backedCoins.get("OPEN", []).find(c => {
                return c.symbol === this.state.withdrawAsset;
            }) || {};
        const currentBridges =
            this.props.bridgeCoins.get(this.state.bridgeAsset) || null;

        // add unicode non-breaking space as subtext to Activity Tab to ensure that all titles are aligned
        // horizontally
        const hiddenSubText = "\u00a0";

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <Tabs
                            defaultActiveTab={0}
                            segmented={false}
                            setting="overviewTab"
                            className="account-tabs"
                            tabsClass="account-overview no-padding bordered-header content-block"
                        >
                            <Tab
                                title="account.portfolio"
                                subText={portfolioActiveAssetsBalance}
                            >
                                <div className="header-selector">
                                    <div className="filter inline-block">
                                        <input
                                            type="text"
                                            placeholder="Filter"
                                            onChange={this._handleFilterInput}
                                        />
                                    </div>
                                    <div className="selector inline-block">
                                        <div
                                            className={cnames("inline-block", {
                                                inactive:
                                                    shownAssets != "active"
                                            })}
                                            onClick={
                                                shownAssets != "active"
                                                    ? this._changeShownAssets.bind(
                                                          this,
                                                          "active"
                                                      )
                                                    : () => {}
                                            }
                                        >
                                            <Translate content="account.hide_hidden" />
                                        </div>
                                        {hiddenBalances.length ? (
                                            <div
                                                className={cnames(
                                                    "inline-block",
                                                    {
                                                        inactive:
                                                            shownAssets !=
                                                            "hidden"
                                                    }
                                                )}
                                                onClick={
                                                    shownAssets != "hidden"
                                                        ? this._changeShownAssets.bind(
                                                              this,
                                                              "hidden"
                                                          )
                                                        : () => {}
                                                }
                                            >
                                                <Translate content="account.show_hidden" />
                                            </div>
                                        ) : null}
                                        <div
                                            className={cnames("inline-block", {
                                                inactive:
                                                    shownAssets != "visual"
                                            })}
                                            onClick={
                                                shownAssets != "visual"
                                                    ? this._changeShownAssets.bind(
                                                          this,
                                                          "visual"
                                                      )
                                                    : () => {}
                                            }
                                        >
                                            <Translate content="account.show_visual" />
                                        </div>
                                    </div>
                                </div>

                                {/* Send Modal */}
                                <SendModal
                                    id="send_modal_portfolio"
                                    refCallback={e => {
                                        if (e) this.send_modal = e;
                                    }}
                                    from_name={this.props.account.get("name")}
                                    asset_id={this.state.send_asset || "1.3.0"}
                                />
                                {shownAssets != "visual" ? (
                                    <table className="table dashboard-table table-hover">
                                        <thead>
                                            <tr>
                                                <th
                                                    style={{textAlign: "left"}}
                                                    className="clickable"
                                                    onClick={this._toggleSortOrder.bind(
                                                        this,
                                                        "alphabetic"
                                                    )}
                                                >
                                                    <Translate
                                                        component="span"
                                                        content="account.asset"
                                                    />
                                                </th>
                                                <th
                                                    onClick={this._toggleSortOrder.bind(
                                                        this,
                                                        "qty"
                                                    )}
                                                    className="clickable"
                                                    style={{textAlign: "right"}}
                                                >
                                                    <Translate content="account.qty" />
                                                </th>
                                                <th
                                                    onClick={this._toggleSortOrder.bind(
                                                        this,
                                                        "priceValue"
                                                    )}
                                                    className="column-hide-small clickable"
                                                    style={{textAlign: "right"}}
                                                >
                                                    <Translate content="exchange.price" />{" "}
                                                    (<AssetName
                                                        name={preferredUnit}
                                                        noTip
                                                    />)
                                                </th>
                                                <th
                                                    onClick={this._toggleSortOrder.bind(
                                                        this,
                                                        "changeValue"
                                                    )}
                                                    className="column-hide-small clickable"
                                                    style={{textAlign: "right"}}
                                                >
                                                    <Translate content="account.hour_24_short" />
                                                </th>
                                                <th
                                                    onClick={this._toggleSortOrder.bind(
                                                        this,
                                                        "totalValue"
                                                    )}
                                                    style={{textAlign: "right"}}
                                                    className="column-hide-small clickable"
                                                >
                                                    <TranslateWithLinks
                                                        noLink
                                                        string="account.eq_value_header"
                                                        keys={[
                                                            {
                                                                type: "asset",
                                                                value: preferredUnit,
                                                                arg: "asset"
                                                            }
                                                        ]}
                                                        noTip
                                                    />
                                                </th>
                                                {showAssetPercent ? (
                                                    <th
                                                        style={{
                                                            textAlign: "right"
                                                        }}
                                                    >
                                                        <Translate
                                                            component="span"
                                                            content="account.percent"
                                                        />
                                                    </th>
                                                ) : null}
                                                <th>
                                                    <Translate content="header.payments" />
                                                </th>
                                                <th>
                                                    <Translate content="exchange.buy" />
                                                </th>
                                                <th>
                                                    <Translate content="modal.deposit.submit" />
                                                </th>
                                                <th>
                                                    <Translate content="modal.withdraw.submit" />
                                                </th>
                                                <th>
                                                    <Translate content="account.trade" />
                                                </th>
                                                <th>
                                                    <Translate content="exchange.borrow_short" />
                                                </th>
                                                <th>
                                                    <Translate content="account.settle" />
                                                </th>
                                                <th className="column-hide-small">
                                                    <Translate
                                                        content={
                                                            shownAssets ==
                                                            "active"
                                                                ? "exchange.hide"
                                                                : "account.perm.show"
                                                        }
                                                    />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shownAssets == "hidden" &&
                                            hiddenBalances.length
                                                ? hiddenBalances
                                                : includedBalances}
                                        </tbody>
                                    </table>
                                ) : (
                                    <AccountTreemap
                                        balanceObjects={includedBalancesList}
                                    />
                                )}
                            </Tab>

                            <Tab
                                title="account.open_orders"
                                subText={ordersValue}
                            >
                                <AccountOrders {...this.props}>
                                    <tbody>
                                        <tr className="total-value">
                                            <td
                                                colSpan="7"
                                                style={{textAlign: "right"}}
                                            >
                                                {totalValueText}
                                            </td>
                                            <td
                                                colSpan="2"
                                                style={{textAlign: "left"}}
                                            >
                                                {ordersValue}
                                            </td>
                                            {this.props.isMyAccount ? (
                                                <td />
                                            ) : null}
                                        </tr>
                                    </tbody>
                                </AccountOrders>
                            </Tab>

                            <Tab
                                title="account.collaterals"
                                subText={
                                    <span
                                        className={
                                            this.state.globalMarginStatus
                                        }
                                    >
                                        {marginValue}
                                    </span>
                                }
                            >
                                <div className="content-block">
                                    <div className="generic-bordered-box">
                                        <MarginPositions
                                            preferredUnit={preferredUnit}
                                            className="dashboard-table"
                                            callOrders={call_orders}
                                            account={account}
                                        >
                                            <tr className="total-value">
                                                <td>{totalValueText}</td>
                                                <td />
                                                <td>{debtValue}</td>
                                                <td className="column-hide-medium">
                                                    {collateralValue}
                                                </td>
                                                <td />
                                                <td>{marginValue}</td>
                                                <td className="column-hide-small" />
                                                <td className="column-hide-small" />
                                                <td colSpan="3" />
                                            </tr>
                                        </MarginPositions>
                                    </div>
                                </div>
                            </Tab>

                            <Tab
                                title="account.activity"
                                subText={hiddenSubText}
                            >
                                <RecentTransactions
                                    accountsList={Immutable.fromJS([
                                        account.get("id")
                                    ])}
                                    compactView={false}
                                    showMore={true}
                                    fullHeight={true}
                                    limit={15}
                                    showFilters={true}
                                    dashboard
                                />
                            </Tab>

                            {account.get("proposals") &&
                            account.get("proposals").size ? (
                                <Tab
                                    title="explorer.proposals.title"
                                    subText={
                                        account.get("proposals")
                                            ? account.get("proposals").size
                                            : 0
                                    }
                                >
                                    <Proposals
                                        className="dashboard-table"
                                        account={account.get("id")}
                                    />
                                </Tab>
                            ) : null}
                        </Tabs>
                    </div>
                </div>

                {/* Settle Modal */}
                <SettleModal
                    ref="settlement_modal"
                    modalId="settlement_modal"
                    asset={this.state.settleAsset}
                    account={account.get("name")}
                />

                {/* Withdraw Modal*/}
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
                    isDown={this.props.gatewayDown.get("OPEN")}
                />

                <WithdrawModal
                    ref="withdraw_modal_new"
                    modalId="withdraw_modal_new"
                    backedCoins={this.props.backedCoins}
                    initialSymbol={this.state.withdrawAsset}
                />

                {/* Deposit Modal */}
                <DepositModal
                    ref="deposit_modal_new"
                    modalId="deposit_modal_new"
                    asset={this.state.depositAsset}
                    account={this.props.account.get("name")}
                    backedCoins={this.props.backedCoins}
                />

                {/* Bridge modal */}
                <SimpleDepositBlocktradesBridge
                    ref="bridge_modal"
                    action="deposit"
                    account={this.props.account.get("name")}
                    sender={this.props.account.get("id")}
                    asset={this.state.bridgeAsset}
                    modalId="simple_bridge_modal"
                    balances={this.props.balances}
                    bridges={currentBridges}
                    isDown={this.props.gatewayDown.get("TRADE")}
                />
            </div>
        );
    }
}

AccountOverview = AssetWrapper(AccountOverview, {propNames: ["core_asset"]});
AccountOverview = AssetWrapper(AccountOverview, {
    propNames: ["balanceAssets"],
    asList: true
});

export default class AccountOverviewWrapper extends React.Component {
    render() {
        return <BalanceWrapper {...this.props} wrap={AccountOverview} />;
    }
}
