import React from "react";
import debounceRender from "react-debounce-render";
import BalanceComponent from "../Utility/BalanceComponent";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import {Market24HourChangeComponent} from "../Utility/MarketChangeComponent";
import assetUtils from "common/asset_utils";
import counterpart from "counterpart";
import {Link} from "react-router-dom";
import EquivalentPrice from "../Utility/EquivalentPrice";
import LinkToAssetById from "../Utility/LinkToAssetById";
import BorrowModal from "../Modal/BorrowModal";
import ReactTooltip from "react-tooltip";
import {getBackedCoin} from "common/gatewayUtils";
import {ChainStore} from "bitsharesjs";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import GatewayStore from "stores/GatewayStore";
import MarketsStore from "stores/MarketsStore";
import Icon from "../Icon/Icon";
import PulseIcon from "../Icon/PulseIcon";
import utils from "common/utils";
import SendModal from "../Modal/SendModal";
import SettingsActions from "actions/SettingsActions";
import SettleModal from "../Modal/SettleModal";
import DepositModal from "../Modal/DepositModal";
import SimpleDepositWithdraw from "../Dashboard/SimpleDepositWithdraw";
import SimpleDepositBlocktradesBridge from "../Dashboard/SimpleDepositBlocktradesBridge";
import WithdrawModal from "../Modal/WithdrawModalNew";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import ReserveAssetModal from "../Modal/ReserveAssetModal";
import BaseModal from "../Modal/BaseModal";
import PaginatedList from "../Utility/PaginatedList";
import MarketUtils from "common/market_utils";

class AccountPortfolioList extends React.Component {
    constructor() {
        super();

        this.state = {
            settleAsset: "1.3.0",
            depositAsset: null,
            withdrawAsset: null,
            bridgeAsset: null,
            allRefsAssigned: false
        };

        this.qtyRefs = {};
        this.priceRefs = {};
        this.valueRefs = {};
        this.changeRefs = {};
        for (let key in this.sortFunctions) {
            this.sortFunctions[key] = this.sortFunctions[key].bind(this);
        }
        this._checkRefAssignments = this._checkRefAssignments.bind(this);
    }

    componentWillMount() {
        this.refCheckInterval = setInterval(this._checkRefAssignments);
    }

    componentWillUnmount() {
        clearInterval(this.refCheckInterval);
    }

    _checkRefAssignments() {
        /*
        * In order for sorting to work all refs must be assigned, so we check
        * this here and update the state to trigger a rerender
        */
        if (!this.state.allRefsAssigned) {
            let refKeys = ["qtyRefs", "priceRefs", "valueRefs", "changeRefs"];
            const allRefsAssigned = refKeys.reduce((a, b) => {
                if (a === undefined) return !!Object.keys(this[b]).length;
                return !!Object.keys(this[b]).length && a;
            }, undefined);
            if (allRefsAssigned) {
                clearInterval(this.refCheckInterval);
                this.setState({allRefsAssigned});
            }
        }
    }

    shouldComponentUpdate(np, ns) {
        return (
            !utils.are_equal_shallow(ns, this.state) ||
            !utils.are_equal_shallow(np.backedCoins, this.props.backedCoins) ||
            !utils.are_equal_shallow(np.balances, this.props.balances) ||
            !utils.are_equal_shallow(np.balanceList, this.props.balanceList) ||
            !utils.are_equal_shallow(
                np.optionalAssets,
                this.props.optionalAssets
            ) ||
            np.account !== this.props.account ||
            np.visible !== this.props.visible ||
            np.settings !== this.props.settings ||
            np.hiddenAssets !== this.props.hiddenAssets ||
            np.sortDirection !== this.props.sortDirection ||
            np.sortKey !== this.props.sortKey ||
            np.allMarketStats.reduce((a, value, key) => {
                return (
                    utils.check_market_stats(
                        value,
                        this.props.allMarketStats.get(key)
                    ) || a
                );
            }, false)
        );
    }

    sortFunctions = {
        qty: function(a, b, force) {
            if (Number(this.qtyRefs[a.key]) < Number(this.qtyRefs[b.key]))
                return this.props.sortDirection || force ? -1 : 1;

            if (Number(this.qtyRefs[a.key]) > Number(this.qtyRefs[b.key]))
                return this.props.sortDirection || force ? 1 : -1;
        },
        alphabetic: function(a, b, force) {
            if (a.key > b.key)
                return this.props.sortDirection || force ? 1 : -1;
            if (a.key < b.key)
                return this.props.sortDirection || force ? -1 : 1;
            return 0;
        },
        priceValue: function(a, b) {
            let aPrice = this.priceRefs[a.key];
            let bPrice = this.priceRefs[b.key];
            if (aPrice && bPrice) {
                return this.props.sortDirection
                    ? aPrice - bPrice
                    : bPrice - aPrice;
            } else if (aPrice === null && bPrice !== null) {
                return 1;
            } else if (aPrice !== null && bPrice === null) {
                return -1;
            } else {
                return this.sortFunctions.alphabetic(a, b, true);
            }
        },
        totalValue: function(a, b) {
            let aValue = this.valueRefs[a.key];
            let bValue = this.valueRefs[b.key];
            if (aValue && bValue) {
                return this.props.sortDirection
                    ? aValue - bValue
                    : bValue - aValue;
            } else if (!aValue && bValue) {
                return 1;
            } else if (aValue && !bValue) {
                return -1;
            } else {
                return this.sortFunctions.alphabetic(a, b, true);
            }
        },
        changeValue: function(a, b) {
            let aValue = this.changeRefs[a.key];
            let bValue = this.changeRefs[b.key];

            if (aValue && bValue) {
                let aChange =
                    parseFloat(aValue) != "NaN" ? parseFloat(aValue) : aValue;
                let bChange =
                    parseFloat(bValue) != "NaN" ? parseFloat(bValue) : bValue;
                let direction =
                    typeof this.props.sortDirection !== "undefined"
                        ? this.props.sortDirection
                        : true;

                return direction ? aChange - bChange : bChange - aChange;
            }
        }
    };

    triggerSend(asset) {
        this.setState({send_asset: asset}, () => {
            if (this.send_modal) this.send_modal.show();
        });
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

    _burnAsset(asset, e) {
        e.preventDefault();
        this.setState({reserve: asset});
        ZfApi.publish("reserve_asset", "open");
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
                            title="icons.dollar.buy"
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
                        <Icon
                            name="dollar"
                            title="icons.dollar.buy"
                            className="icon-14px"
                        />
                    </a>
                </span>
            ) : (
                emptyCell
            );
        }
    };

    _renderBalances(balanceList, optionalAssets, visible) {
        const {
            coreSymbol,
            preferredUnit,
            settings,
            hiddenAssets,
            orders
        } = this.props;
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
                        <Icon
                            name="dollar"
                            title="icons.dollar.borrow"
                            className="icon-14px"
                        />
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
            const notCorePrefUnit = preferredUnit !== coreSymbol;

            let {market} = assetUtils.parseDescription(
                asset.getIn(["options", "description"])
            );
            symbol = asset.get("symbol");
            if (symbol.indexOf("OPEN.") !== -1 && !market) market = "USD";
            let preferredMarket = market ? market : preferredUnit;

            if (notCore && preferredMarket === symbol)
                preferredMarket = coreSymbol;

            /* Table content */
            directMarketLink = notCore ? (
                <Link to={`/market/${asset.get("symbol")}_${preferredMarket}`}>
                    <Icon
                        name="trade"
                        title="icons.trade.trade"
                        className="icon-14px"
                    />
                </Link>
            ) : notCorePrefUnit ? (
                <Link to={`/market/${asset.get("symbol")}_${preferredUnit}`}>
                    <Icon
                        name="trade"
                        title="icons.trade.trade"
                        className="icon-14px"
                    />
                </Link>
            ) : (
                emptyCell
            );
            transferLink = (
                <a onClick={this.triggerSend.bind(this, asset.get("id"))}>
                    <Icon
                        name="transfer"
                        title="icons.transfer"
                        className="icon-14px"
                    />
                </a>
            );

            let {isBitAsset, borrowModal, borrowLink} = renderBorrow(
                asset,
                this.props.account
            );

            /* Popover content */
            settleLink = (
                <a onClick={this._onSettleAsset.bind(this, asset.get("id"))}>
                    <Icon
                        name="settle"
                        title="icons.settle"
                        className="icon-14px"
                    />
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

            /* Sorting refs */
            this.qtyRefs[asset.get("symbol")] = utils.get_asset_amount(
                assetAmount,
                asset
            );

            {
                /* Asset and Backing Asset Prefixes */
            }
            let options =
                asset && asset.getIn(["bitasset", "options"])
                    ? asset.getIn(["bitasset", "options"]).toJS()
                    : null;
            let backingAsset =
                options && options.short_backing_asset
                    ? ChainStore.getAsset(options.short_backing_asset)
                    : null;
            let {isBitAsset: isAssetBitAsset} = utils.replaceName(asset);
            let {isBitAsset: isBackingBitAsset} = utils.replaceName(
                backingAsset
            );

            let preferredAsset = ChainStore.getAsset(preferredUnit);
            this.valueRefs[asset.get("symbol")] =
                hasBalance && !!preferredAsset
                    ? MarketUtils.convertValue(
                          assetAmount,
                          preferredAsset,
                          asset,
                          this.props.allMarketStats,
                          this.props.coreAsset,
                          true
                      )
                    : null;

            this.priceRefs[asset.get("symbol")] = !preferredAsset
                ? null
                : MarketUtils.getFinalPrice(
                      this.props.coreAsset,
                      asset,
                      preferredAsset,
                      this.props.allMarketStats,
                      true
                  );

            let marketId = asset.get("symbol") + "_" + preferredUnit;
            let currentMarketStats = this.props.allMarketStats.get(marketId);
            this.changeRefs[asset.get("symbol")] =
                currentMarketStats && currentMarketStats.change
                    ? currentMarketStats.change
                    : 0;

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
                            base={asset.get("id")}
                            quote={preferredUnit}
                            marketId={marketId}
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
                                    title="icons.deposit.deposit"
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
                                        title="icons.withdraw"
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
                        {isBitAsset && backingAsset ? (
                            <div
                                className="inline-block"
                                data-place="bottom"
                                data-tip={counterpart.translate(
                                    "tooltip.settle",
                                    {
                                        asset: isAssetBitAsset
                                            ? "bit" + symbol
                                            : symbol,
                                        backingAsset: isBackingBitAsset
                                            ? "bit" + backingAsset.get("symbol")
                                            : backingAsset.get("symbol"),
                                        settleDelay:
                                            options.force_settlement_delay_sec /
                                            3600
                                    }
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
                    >
                        {!isBitAsset ? (
                            <a
                                style={{marginRight: 0}}
                                onClick={this._burnAsset.bind(
                                    this,
                                    asset.get("id")
                                )}
                            >
                                <Icon name="fire" className="icon-14px" />
                            </a>
                        ) : null}
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
                                title={
                                    includeAsset
                                        ? "icons.cross_circle.hide_asset"
                                        : "icons.plus_circle.show_asset"
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
                        let preferredMarket = market ? market : coreSymbol;

                        let directMarketLink = notCore ? (
                            <Link
                                to={`/market/${asset.get(
                                    "symbol"
                                )}_${preferredMarket}`}
                            >
                                <Icon
                                    name="trade"
                                    title="icons.trade.trade"
                                    className="icon-14px"
                                />
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
                                                        title="icons.dollar.buy"
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
                                                    title="icons.deposit.deposit"
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
                                                title={
                                                    includeAsset
                                                        ? "icons.cross_circle.hide_asset"
                                                        : "icons.plus_circle.show_asset"
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

        balances.sort(this.sortFunctions[this.props.sortKey]);
        return balances;
    }

    _renderSendModal() {
        return (
            <SendModal
                id="send_modal_portfolio"
                refCallback={e => {
                    if (e) this.send_modal = e;
                }}
                from_name={this.props.account.get("name")}
                asset_id={this.state.send_asset || "1.3.0"}
            />
        );
    }

    _renderSettleModal() {
        return (
            <SettleModal
                ref="settlement_modal"
                modalId="settlement_modal"
                asset={this.state.settleAsset}
                account={this.props.account.get("name")}
            />
        );
    }

    render() {
        const currentWithdrawAsset =
            this.props.backedCoins.get("OPEN", []).find(c => {
                return c.symbol === this.state.withdrawAsset;
            }) || {};
        const currentBridges =
            this.props.bridgeCoins.get(this.state.bridgeAsset) || null;

        return (
            <div>
                <PaginatedList
                    style={{padding: 0}}
                    className="table dashboard-table table-hover"
                    rows={this._renderBalances(
                        this.props.balanceList,
                        this.props.optionalAssets,
                        this.props.visible
                    )}
                    header={this.props.header}
                    pageSize={20}
                    label="utility.total_x_assets"
                    extraRow={this.props.extraRow}
                    leftPadding="1.5rem"
                >
                    {this._renderSendModal()}
                    {this._renderSettleModal()}
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

                    {/* Burn modal */}
                    <BaseModal id="reserve_asset" overlay={true}>
                        <br />
                        <div className="grid-block vertical">
                            <ReserveAssetModal
                                asset={this.state.reserve}
                                account={this.props.account}
                                onClose={() => {
                                    ZfApi.publish("reserve_asset", "close");
                                }}
                            />
                        </div>
                    </BaseModal>
                </PaginatedList>
            </div>
        );
    }
}

AccountPortfolioList = connect(
    AccountPortfolioList,
    {
        listenTo() {
            return [SettingsStore, GatewayStore, MarketsStore];
        },
        getProps() {
            return {
                settings: SettingsStore.getState().settings,
                viewSettings: SettingsStore.getState().viewSettings,
                backedCoins: GatewayStore.getState().backedCoins,
                bridgeCoins: GatewayStore.getState().bridgeCoins,
                gatewayDown: GatewayStore.getState().down,
                allMarketStats: MarketsStore.getState().allMarketStats
            };
        }
    }
);

AccountPortfolioList = debounceRender(AccountPortfolioList, 50, {
    leading: false
});

export default AccountPortfolioList;
