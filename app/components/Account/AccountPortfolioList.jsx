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
import SimpleDepositBlocktradesBridge from "../Dashboard/SimpleDepositBlocktradesBridge";
import WithdrawModal from "../Modal/WithdrawModalNew";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import ReserveAssetModal from "../Modal/ReserveAssetModal";
import PaginatedList from "../Utility/PaginatedList";
import MarketUtils from "common/market_utils";
import {Tooltip, Icon as AntIcon} from "bitshares-ui-style-guide";
import Translate from "react-translate-component";
import AssetName from "../Utility/AssetName";
import TranslateWithLinks from "../Utility/TranslateWithLinks";

class AccountPortfolioList extends React.Component {
    constructor(props) {
        super();

        this.state = {
            isBridgeModalVisible: false,
            isSettleModalVisible: false,
            isBorrowModalVisible: false,
            isDepositModalVisible: false,
            isWithdrawModalVisible: false,
            isBurnModalVisible: false,
            isBridgeModalVisibleBefore: false,
            isSettleModalVisibleBefore: false,
            isBorrowModalVisibleBefore: false,
            isDepositModalVisibleBefore: false,
            isWithdrawModalVisibleBefore: false,
            isBurnModalVisibleBefore: false,
            borrow: null,
            settleAsset: "1.3.0",
            depositAsset: null,
            withdrawAsset: null,
            bridgeAsset: null,
            allRefsAssigned: false,
            portfolioSort: props.viewSettings.get("portfolioSort", "value"),
            portfolioSortDirection: props.viewSettings.get(
                "portfolioSortDirection",
                "ascend"
            ) // alphabetical A -> B, numbers high to low
        };

        this.qtyRefs = {};
        this.priceRefs = {};
        this.valueRefs = {};
        this.changeRefs = {};
        for (let key in this.sortFunctions) {
            this.sortFunctions[key] = this.sortFunctions[key].bind(this);
        }
        this._checkRefAssignments = this._checkRefAssignments.bind(this);

        this.showSettleModal = this.showSettleModal.bind(this);
        this.hideSettleModal = this.hideSettleModal.bind(this);

        this.showDepositModal = this.showDepositModal.bind(this);
        this.hideDepositModal = this.hideDepositModal.bind(this);

        this.showWithdrawModal = this.showWithdrawModal.bind(this);
        this.hideWithdrawModal = this.hideWithdrawModal.bind(this);

        this.showBorrowModal = this.showBorrowModal.bind(this);
        this.hideBorrowModal = this.hideBorrowModal.bind(this);

        this.showBurnModal = this.showBurnModal.bind(this);
        this.hideBurnModal = this.hideBurnModal.bind(this);

        this.showBridgeModal = this.showBridgeModal.bind(this);
        this.hideBridgeModal = this.hideBridgeModal.bind(this);

        this.toggleSortOrder = this.toggleSortOrder.bind(this);
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
            ns.portfolioSort !== this.state.portfolioSort ||
            ns.portfolioSortDirection !== this.state.portfolioSortDirection ||
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

    showBridgeModal() {
        this.setState({
            isBridgeModalVisible: true,
            isBridgeModalVisibleBefore: true
        });
    }

    hideBridgeModal() {
        this.setState({
            isBridgeModalVisible: false
        });
    }

    showWithdrawModal() {
        this.setState({
            isWithdrawModalVisible: true,
            isWithdrawModalVisibleBefore: true
        });
    }

    hideWithdrawModal() {
        this.setState({
            isWithdrawModalVisible: false
        });
    }

    showBurnModal() {
        this.setState({
            isBurnModalVisible: true,
            isBurnModalVisibleBefore: true
        });
    }

    hideBurnModal() {
        this.setState({
            isBurnModalVisible: false
        });
    }

    showSettleModal() {
        this.setState({
            isSettleModalVisible: true,
            isSettleModalVisibleBefore: true
        });
    }

    hideSettleModal() {
        this.setState({
            isSettleModalVisible: false
        });
    }

    showDepositModal() {
        this.setState({
            isDepositModalVisible: true,
            isDepositModalVisibleBefore: true
        });
    }

    hideDepositModal() {
        this.setState({
            isDepositModalVisible: false
        });
    }

    showBorrowModal(quoteAsset, backingAsset, account) {
        this.setState({
            isBorrowModalVisible: true,
            isBorrowModalVisibleBefore: true,
            borrow: {
                quoteAsset: quoteAsset,
                backingAsset: backingAsset,
                account: account
            }
        });
    }

    hideBorrowModal() {
        this.setState({
            borrow: null,
            isBorrowModalVisible: false
        });
    }

    sortFunctions = {
        qty: function(a, b, force) {
            if (Number(this.qtyRefs[a.key]) < Number(this.qtyRefs[b.key]))
                return this.state.portfolioSortDirection || force ? -1 : 1;

            if (Number(this.qtyRefs[a.key]) > Number(this.qtyRefs[b.key]))
                return this.state.portfolioSortDirection || force ? 1 : -1;
        },
        alphabetic: function(a, b, force) {
            if (a.key > b.key)
                return this.state.portfolioSortDirection || force ? 1 : -1;
            if (a.key < b.key)
                return this.state.portfolioSortDirection || force ? -1 : 1;
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
                    typeof this.state.portfolioSortDirection !== "undefined"
                        ? this.state.portfolioSortDirection
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

        this.showSettleModal();
    }

    _hideAsset(asset, status) {
        SettingsActions.hideAsset(asset, status);
    }

    _burnAsset(asset, e) {
        e.preventDefault();
        this.setState({reserve: asset});
        this.showBurnModal();
    }

    _showDepositModal(asset, e) {
        e.preventDefault();
        this.setState({depositAsset: asset}, () => {
            this.showDepositModal();
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
                if (action === "bridge_modal") {
                    this.showBridgeModal();
                    return true;
                }

                if (action === "deposit_modal") {
                    this.showDepositModal();
                    return true;
                }

                this.showWithdrawModal();
            }
        );
    }

    _getSeparator(render) {
        return render ? <span>&nbsp;|&nbsp;</span> : null;
    }

    _renderBuy = (symbol, canBuy, assetName, emptyCell, balance) => {
        if (symbol === "BTS" && balance <= 1000000) {
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
            let modalAction = this._showDepositWithdraw.bind(
                this,
                "bridge_modal",
                assetName,
                false
            );

            let linkElement = (
                <span>
                    <Icon
                        style={{
                            cursor: this.props.isMyAccount ? "pointer" : "help"
                        }}
                        name="dollar"
                        title="icons.dollar.buy"
                        className="icon-14px"
                        onClick={this.props.isMyAccount ? modalAction : null}
                    />
                </span>
            );

            if (canBuy && this.props.isMyAccount) {
                return linkElement;
            } else if (canBuy && !this.props.isMyAccount) {
                return (
                    <Tooltip
                        title={counterpart.translate("tooltip.login_required")}
                    >
                        {linkElement}
                    </Tooltip>
                );
            } else {
                return emptyCell;
            }
        }
    };

    _renderGatewayAction = (type, allowed, assetName, emptyCell) => {
        let modalAction =
            type == "deposit"
                ? this._showDepositModal.bind(this, assetName)
                : this._showDepositWithdraw.bind(
                      this,
                      "withdraw_modal_new",
                      assetName,
                      false
                  );

        let actionTitle =
            type == "deposit" ? `icons.${type}.${type}` : `icons.${type}`;

        let linkElement = (
            <span>
                <Icon
                    style={{
                        cursor: this.props.isMyAccount ? "pointer" : "help"
                    }}
                    name={type}
                    title={actionTitle}
                    className="icon-14x"
                    onClick={this.props.isMyAccount ? modalAction : null}
                />
            </span>
        );

        if (allowed && this.props.isMyAccount) {
            return linkElement;
        } else if (allowed && !this.props.isMyAccount) {
            return (
                <Tooltip
                    title={counterpart.translate("tooltip.login_required")}
                >
                    {linkElement}
                </Tooltip>
            );
        } else {
            return emptyCell;
        }
    };

    toggleSortOrder(pagination, filters, sorter) {
        SettingsActions.changeViewSetting({
            portfolioSortDirection: sorter.order,
            portfolioSort: sorter.columnKey
        });
        this.setState({
            portfolioSortDirection: sorter.order,
            portfolioSort: sorter.columnKey
        });
    }

    getHeader() {
        let {settings} = this.props;
        let {shownAssets, portfolioSortDirection, portfolioSort} = this.state;

        const preferredUnit =
            settings.get("unit") || this.props.core_asset.get("symbol");
        const showAssetPercent = settings.get("showAssetPercent", false);

        return [
            {
                title: (
                    <Translate
                        component="span"
                        content="account.asset"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "asset",
                align: "left",
                sorter: this.sortFunctions.alphabetic,
                sortOrder: portfolioSort === "asset" && portfolioSortDirection,
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: (
                    <Translate
                        content="account.qty"
                        style={{
                            marginRight: "5px",
                            whiteSpace: "nowrap"
                        }}
                    />
                ),
                dataIndex: "qty",
                align: "right",
                sorter: this.sortFunctions.qty,
                sortOrder: portfolioSort === "qty" && portfolioSortDirection,
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-small",
                title: (
                    <span
                        style={{
                            marginRight: "5px",
                            whiteSpace: "nowrap"
                        }}
                    >
                        <Translate content="exchange.price" /> (
                        <AssetName name={preferredUnit} noTip />)
                    </span>
                ),
                dataIndex: "price",
                align: "right",
                sorter: this.sortFunctions.priceValue,
                sortOrder: portfolioSort === "price" && portfolioSortDirection,
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-small",
                title: (
                    <Translate
                        content="account.hour_24_short"
                        style={{
                            marginRight: "5px",
                            whiteSpace: "nowrap"
                        }}
                    />
                ),
                dataIndex: "hour24",
                align: "right",
                sorter: this.sortFunctions.changeValue,
                sortOrder: portfolioSort === "hour24" && portfolioSortDirection,
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-small",
                title: (
                    <span
                        style={{
                            marginRight: "5px",
                            whiteSpace: "nowrap"
                        }}
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
                    </span>
                ),
                dataIndex: "value",
                align: "right",
                sorter: this.sortFunctions.totalValue,
                sortOrder: portfolioSort === "value" && portfolioSortDirection,
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            showAssetPercent
                ? {
                      title: (
                          <Translate
                              component="span"
                              content="account.percent"
                              style={{whiteSpace: "nowrap"}}
                          />
                      ),
                      dataIndex: "percent",
                      align: "right",
                      render: item => {
                          return (
                              <span style={{whiteSpace: "nowrap"}}>{item}</span>
                          );
                      }
                  }
                : {},
            {
                title: (
                    <Translate
                        content="header.payments"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "payments",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: (
                    <Translate
                        content="exchange.buy"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "buy",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: (
                    <Translate
                        content="modal.deposit.submit"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "deposit",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: (
                    <Translate
                        content="modal.withdraw.submit"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "withdraw",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: (
                    <Translate
                        content="account.trade"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "trade",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: (
                    <Translate
                        content="exchange.borrow_short"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "borrow",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: (
                    <Translate
                        content="account.settle"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "settle",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-small",
                title: (
                    <Translate
                        content="modal.reserve.submit"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "burn",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-small",
                title: (
                    <Translate
                        content={
                            shownAssets == "active"
                                ? "exchange.hide"
                                : "account.perm.show"
                        }
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "hide",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            }
        ];
    }

    _renderBalances(balanceList, optionalAssets, visible) {
        const {
            coreSymbol,
            preferredUnit,
            settings,
            hiddenAssets,
            orders
        } = this.props;

        const renderBorrow = (asset, account) => {
            let isBitAsset = asset && asset.has("bitasset_data_id");
            let isGlobalSettled =
                isBitAsset && asset.getIn(["bitasset", "settlement_fund"]) > 0
                    ? true
                    : false;

            return {
                isBitAsset,
                borrowLink:
                    !isBitAsset || isGlobalSettled ? null : (
                        <a
                            onClick={() => {
                                ReactTooltip.hide();
                                this.showBorrowModal(
                                    asset.get("id"),
                                    asset.getIn([
                                        "bitasset",
                                        "options",
                                        "short_backing_asset"
                                    ]),
                                    account
                                );
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

            let {isBitAsset, borrowLink} = renderBorrow(
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
            let settlePriceTitle;
            if (
                isBitAsset &&
                asset.get("bitasset").get("settlement_fund") > 0
            ) {
                settlePriceTitle = "tooltip.global_settle";
            } else {
                settlePriceTitle = "tooltip.settle";
            }

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

            balances.push({
                key: asset.get("symbol"),
                asset: <LinkToAssetById asset={asset.get("id")} />,
                qty:
                    hasBalance || hasOnOrder ? (
                        <BalanceComponent balance={balance} hide_asset />
                    ) : null,
                price: (
                    <EquivalentPrice
                        fromAsset={asset.get("id")}
                        pulsate={{reverse: true, fill: "forwards"}}
                        hide_symbols
                    />
                ),
                hour24: (
                    <Market24HourChangeComponent
                        base={asset.get("id")}
                        quote={preferredUnit}
                        marketId={marketId}
                        hide_symbols
                    />
                ),
                value:
                    hasBalance || hasOnOrder ? (
                        <BalanceValueComponent
                            balance={balance}
                            toAsset={preferredUnit}
                            hide_asset
                        />
                    ) : null,
                percent: hasBalance ? (
                    <BalanceComponent balance={balance} asPercentage={true} />
                ) : null,
                payments: transferLink,
                buy: this._renderBuy(
                    asset.get("symbol"),
                    canBuy,
                    assetName,
                    emptyCell,
                    balanceObject.get("balance")
                ),
                deposit: this._renderGatewayAction(
                    "deposit",
                    canDeposit,
                    assetName,
                    emptyCell
                ),
                withdraw: this._renderGatewayAction(
                    "withdraw",
                    canWithdraw,
                    assetName,
                    emptyCell
                ),
                trade: directMarketLink,
                borrow:
                    isBitAsset && borrowLink ? (
                        <Tooltip
                            title={counterpart.translate("tooltip.borrow", {
                                asset: isAssetBitAsset ? "bit" + symbol : symbol
                            })}
                        >
                            {borrowLink}
                        </Tooltip>
                    ) : isBitAsset && !borrowLink ? (
                        <Tooltip
                            title={counterpart.translate(
                                "tooltip.borrow_disabled",
                                {
                                    asset: isAssetBitAsset
                                        ? "bit" + symbol
                                        : symbol
                                }
                            )}
                        >
                            <AntIcon type={"question-circle"} />
                        </Tooltip>
                    ) : (
                        emptyCell
                    ),
                settle:
                    isBitAsset && backingAsset ? (
                        <Tooltip
                            placement="bottom"
                            title={counterpart.translate(settlePriceTitle, {
                                asset: isAssetBitAsset
                                    ? "bit" + symbol
                                    : symbol,
                                backingAsset: isBackingBitAsset
                                    ? "bit" + backingAsset.get("symbol")
                                    : backingAsset.get("symbol"),
                                settleDelay:
                                    options.force_settlement_delay_sec / 3600
                            })}
                        >
                            <div className="inline-block">{settleLink}</div>
                        </Tooltip>
                    ) : (
                        emptyCell
                    ),
                burn: !isBitAsset ? (
                    <a
                        style={{marginRight: 0}}
                        onClick={this._burnAsset.bind(this, asset.get("id"))}
                    >
                        <Icon name="fire" className="icon-14px" />
                    </a>
                ) : null,
                hide: (
                    <Tooltip
                        placement="bottom"
                        title={counterpart.translate(
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
                    </Tooltip>
                )
            });
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
                        let {isBitAsset, borrowLink} = renderBorrow(
                            asset,
                            this.props.account
                        );
                        if (
                            (includeAsset && visible) ||
                            (!includeAsset && !visible)
                        )
                            balances.push({
                                key: asset.get("symbol"),
                                asset: (
                                    <LinkToAssetById asset={asset.get("id")} />
                                ),
                                qty: emptyCell,
                                price: emptyCell,
                                hour24: emptyCell,
                                value: emptyCell,
                                percent: emptyCell,
                                payments: emptyCell,
                                buy:
                                    canBuy && this.props.isMyAccount ? (
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
                                    ),
                                deposit:
                                    canDeposit && this.props.isMyAccount ? (
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
                                    ),
                                withdraw: emptyCell,
                                trade: directMarketLink,
                                borrow: isBitAsset ? (
                                    <Tooltip
                                        placement="bottom"
                                        title={counterpart.translate(
                                            "tooltip.borrow",
                                            {asset: asset.get("symbol")}
                                        )}
                                    >
                                        <div className="inline-block">
                                            {borrowLink}
                                        </div>
                                    </Tooltip>
                                ) : (
                                    emptyCell
                                ),
                                settle: emptyCell,
                                burn: emptyCell,
                                hide: (
                                    <Tooltip
                                        placement="bottom"
                                        title={counterpart.translate(
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
                                    </Tooltip>
                                )
                            });
                    }
                });
        }
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

    _renderBorrowModal() {
        if (
            !this.state.borrow ||
            !this.state.borrow.quoteAsset ||
            !this.state.borrow.backingAsset ||
            !this.state.borrow.account ||
            !this.state.isBorrowModalVisibleBefore
        ) {
            return null;
        }

        return (
            <BorrowModal
                visible={this.state.isBorrowModalVisible}
                showModal={this.showBorrowModal}
                hideModal={this.hideBorrowModal}
                account={this.state.borrow && this.state.borrow.account}
                quote_asset={this.state.borrow && this.state.borrow.quoteAsset}
                backing_asset={
                    this.state.borrow && this.state.borrow.backingAsset
                }
            />
        );
    }

    _renderSettleModal() {
        return (
            <SettleModal
                visible={this.state.isSettleModalVisible}
                hideModal={this.hideSettleModal}
                showModal={this.showSettleModal}
                asset={this.state.settleAsset}
                account={this.props.account}
            />
        );
    }

    render() {
        const currentBridges =
            this.props.bridgeCoins.get(this.state.bridgeAsset) || null;

        return (
            <div>
                <PaginatedList
                    className="table dashboard-table table-hover"
                    rows={this._renderBalances(
                        this.props.balanceList,
                        this.props.optionalAssets,
                        this.props.visible
                    )}
                    header={this.getHeader()}
                    pageSize={20}
                    label="utility.total_x_assets"
                    extraRow={this.props.extraRow}
                    leftPadding="1.5rem"
                    toggleSortOrder={this.toggleSortOrder}
                >
                    {this._renderSendModal()}
                    {(this.state.isSettleModalVisible ||
                        this.state.isSettleModalVisibleBefore) &&
                        this._renderSettleModal()}
                    {this._renderBorrowModal()}

                    {(this.state.isWithdrawModalVisible ||
                        this.state.isWithdrawModalVisibleBefore) && (
                        <WithdrawModal
                            hideModal={this.hideWithdrawModal}
                            visible={this.state.isWithdrawModalVisible}
                            backedCoins={this.props.backedCoins}
                            initialSymbol={this.state.withdrawAsset}
                        />
                    )}

                    {/* Deposit Modal */}
                    {(this.state.isDepositModalVisible ||
                        this.state.isDepositModalVisibleBefore) && (
                        <DepositModal
                            visible={this.state.isDepositModalVisible}
                            showModal={this.showDepositModal}
                            hideModal={this.hideDepositModal}
                            asset={this.state.depositAsset}
                            account={this.props.account.get("name")}
                            backedCoins={this.props.backedCoins}
                        />
                    )}

                    {/* Bridge modal */}
                    {(this.state.isBridgeModalVisible ||
                        this.state.isBridgeModalVisibleBefore) && (
                        <SimpleDepositBlocktradesBridge
                            visible={this.state.isBridgeModalVisible}
                            showModal={this.showBridgeModal}
                            hideModal={this.hideBridgeModal}
                            action="deposit"
                            account={this.props.account.get("name")}
                            sender={this.props.account.get("id")}
                            asset={this.state.bridgeAsset}
                            balances={this.props.balances}
                            bridges={currentBridges}
                            isDown={this.props.gatewayDown.get("TRADE")}
                        />
                    )}

                    {/* Burn Modal */}
                    {(this.state.isBurnModalVisible ||
                        this.state.isBurnModalVisibleBefore) && (
                        <ReserveAssetModal
                            visible={this.state.isBurnModalVisible}
                            hideModal={this.hideBurnModal}
                            asset={this.state.reserve}
                            account={this.props.account}
                            onClose={() => {
                                ZfApi.publish("reserve_asset", "close");
                            }}
                        />
                    )}
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
