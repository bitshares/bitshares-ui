import React from "react";
import debounceRender from "react-debounce-render";
import BalanceComponent from "../Utility/BalanceComponent";
import {
    BalanceValueComponent,
    balanceToAsset,
    getEquivalentValue
} from "../Utility/EquivalentValueComponent";
import {Market24HourChangeComponent} from "../Utility/MarketChangeComponent";
import FormattedAsset from "../Utility/FormattedAsset";
import assetUtils from "common/asset_utils";
import counterpart from "counterpart";
import {Link} from "react-router-dom";
import EquivalentPrice from "../Utility/EquivalentPrice";
import {getFinalPrice} from "../Utility/EquivalentPrice";
import LinkToAssetById from "../Utility/LinkToAssetById";
import BorrowModal from "../Modal/BorrowModal";
import ReactTooltip from "react-tooltip";
import {getBackedCoin, getAssetAndGateway} from "common/gatewayUtils";
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
import CustomTable from "../Utility/CustomTable";
import {Tooltip, Icon as AntIcon} from "bitshares-ui-style-guide";
import Translate from "react-translate-component";
import AssetName from "../Utility/AssetName";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import MarketsActions from "actions/MarketsActions";

class AccountPortfolioList extends React.Component {
    constructor(props) {
        super(props);

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
                "descend"
            )
        };

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
            let refKeys = ["changeRefs"];
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
        byKey: function(a, b) {
            return a.key > b.key;
        },
        byInCollateral: function(a, b) {
            return this.sortFunctions.byTypedValue(
                a,
                b,
                this._sumCollateralBalances(a.inCollateral),
                this._sumCollateralBalances(b.inCollateral)
            );
        },
        byBalance: function(a, b) {
            return this.sortFunctions.byTypedValue(
                a,
                b,
                balanceToAsset(a.balance).amount,
                balanceToAsset(b.balance).amount
            );
        },
        byVestingBalance: function(a, b) {
            return this.sortFunctions.byTypedValue(
                a,
                b,
                this._sumVestingBalances(a.inVesting),
                this._sumVestingBalances(b.inVesting)
            );
        },
        byInOrders: function(a, b) {
            return this.sortFunctions.byTypedValue(
                a,
                b,
                a.inOrders,
                b.inOrders
            );
        },
        byTypedValue(a, b, aValue, bValue) {
            aValue = utils.convert_satoshi_to_typed(aValue, a.asset);
            bValue = utils.convert_satoshi_to_typed(bValue, b.asset);
            if (aValue && bValue) {
                return aValue - bValue;
            } else if (!aValue && bValue) {
                return -1;
            } else if (aValue && !bValue) {
                return 1;
            } else {
                return this.sortFunctions.byKey(a, b);
            }
        },
        byEquivalentPrice: function(a, b) {
            let aPrice = getFinalPrice(
                a.asset,
                a.adds.preferredAsset,
                this.props.coreAsset,
                null,
                true
            );
            let bPrice = getFinalPrice(
                b.asset,
                b.adds.preferredAsset,
                this.props.coreAsset,
                null,
                true
            );
            if (aPrice && bPrice) {
                return aPrice - bPrice;
            } else if (!aPrice && bPrice) {
                return -1;
            } else if (aPrice && !bPrice) {
                return 1;
            } else {
                return this.sortFunctions.byKey(a, b);
            }
        },
        totalValue: function(a, b) {
            let aValue = getEquivalentValue(
                a.value,
                a.adds.preferredAsset,
                a.adds.asset,
                false
            );
            let bValue = getEquivalentValue(
                b.value,
                b.adds.preferredAsset,
                b.adds.asset,
                false
            );
            if (aValue && bValue) {
                return aValue - bValue;
            } else if (!aValue && bValue) {
                return -1;
            } else if (aValue && !bValue) {
                return 1;
            } else {
                return this.sortFunctions.byKey(a, b);
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
                return aChange - bChange;
            } else if (!aValue && bValue) {
                return -1;
            } else if (aValue && !bValue) {
                return 1;
            } else {
                return this.sortFunctions.byKey(a, b);
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
    }

    getHeader(atLeastOneHas) {
        let {settings} = this.props;
        let {shownAssets} = this.state;

        const preferredUnit =
            settings.get("unit") || this.props.core_asset.get("symbol");
        const showAssetPercent = settings.get("showAssetPercent", false);

        let headerItems = [
            {
                title: <Translate content="account.asset" />,
                dataIndex: "asset",
                align: "left",
                customizable: false,
                sorter: this.sortFunctions.byKey,
                render: item => {
                    return (
                        <span style={{whiteSpace: "nowrap"}}>
                            <LinkToAssetById asset={item.get("id")} />
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.qty" />,
                dataIndex: "balance",
                align: "right",
                customizable: false,
                sorter: this.sortFunctions.byBalance,
                render: item => {
                    return (
                        <span style={{whiteSpace: "nowrap"}}>
                            <BalanceComponent
                                balance={item.get("id")}
                                hide_asset
                            />
                        </span>
                    );
                }
            },
            {
                className: "column-hide-small",
                title: <Translate content="account.inOrders" />,
                dataIndex: "inOrders",
                align: "right",
                sorter: this.sortFunctions.byInOrders,
                render: (item, row) => {
                    if (!item) {
                        return "--";
                    }
                    return (
                        <span style={{whiteSpace: "nowrap"}}>
                            <FormattedAsset
                                amount={item}
                                asset={row.asset.get("id")}
                                hide_asset
                            />
                        </span>
                    );
                }
            },
            {
                className: "column-hide-small",
                title: <Translate content="account.inVestingBalances" />,
                dataIndex: "inVesting",
                align: "right",
                sorter: this.sortFunctions.byVestingBalance,
                render: (item, row) => {
                    if (!item || item.length == 0) {
                        return "--";
                    }
                    return (
                        <span style={{whiteSpace: "noWrap"}}>
                            <FormattedAsset
                                amount={this._sumVestingBalances(item)}
                                asset={row.asset.get("id")}
                                hide_asset
                            />
                        </span>
                    );
                }
            },
            {
                className: "column-hide-small",
                title: <Translate content="account.inCollateral" />,
                dataIndex: "inCollateral",
                align: "right",
                sorter: this.sortFunctions.byInCollateral,
                render: (item, row) => {
                    if (!item || item.length == 0) {
                        return "--";
                    }
                    return (
                        <span style={{whiteSpace: "noWrap"}}>
                            <FormattedAsset
                                amount={this._sumCollateralBalances(item)}
                                asset={row.asset.get("id")}
                                hide_asset
                            />
                        </span>
                    );
                }
            },
            {
                className: "column-hide-small",
                title: (
                    <span style={{whiteSpace: "nowrap"}}>
                        <Translate content="exchange.price" /> (
                        <AssetName name={preferredUnit} noTip />)
                    </span>
                ),
                dataIndex: "price",
                align: "right",
                sorter: this.sortFunctions.byEquivalentPrice,
                render: (item, row) => {
                    return (
                        <span style={{whiteSpace: "nowrap"}}>
                            <EquivalentPrice
                                fromAsset={row.asset.get("id")}
                                pulsate={{reverse: true, fill: "forwards"}}
                                hide_symbols
                            />
                        </span>
                    );
                }
            },
            {
                className: "column-hide-small",
                title: <Translate content="account.hour_24_short" />,
                dataIndex: "hour24",
                align: "right",
                sorter: this.sortFunctions.changeValue,
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-small",
                title: (
                    <span style={{whiteSpace: "nowrap"}}>
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
                customizable: false,
                sorter: this.sortFunctions.totalValue,
                defaultSortOrder: "descend",
                render: (item, row) => {
                    return (
                        <span style={{whiteSpace: "nowrap"}}>
                            <BalanceValueComponent
                                balance={row.adds.balanceObject.get("id")}
                                satoshis={item}
                                toAsset={preferredUnit}
                                hide_asset
                            />
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.percent" />,
                dataIndex: "percent",
                align: "right",
                customizable: {
                    default: showAssetPercent
                },
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: <Translate content="header.payments" />,
                dataIndex: "payments",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-medium",
                title: <Translate content="exchange.buy" />,
                customizable: atLeastOneHas.buy
                    ? undefined
                    : {
                          default: false
                      },
                dataIndex: "buy",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-medium",
                title: atLeastOneHas.depositOnlyBTS ? (
                    <React.Fragment>
                        <Tooltip
                            title={counterpart.translate(
                                "external_service_provider.expect_more"
                            )}
                        >
                            <Translate content="modal.deposit.submit" />
                            &nbsp;
                            <AntIcon type="question-circle" />
                        </Tooltip>
                    </React.Fragment>
                ) : (
                    <Translate content="modal.deposit.submit" />
                ),
                customizable: atLeastOneHas.deposit
                    ? undefined
                    : {
                          default: false
                      },
                dataIndex: "deposit",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-medium",
                title: <Translate content="modal.withdraw.submit" />,
                customizable: atLeastOneHas.withdraw
                    ? undefined
                    : {
                          default: false
                      },
                dataIndex: "withdraw",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-medium",
                title: <Translate content="account.trade" />,
                dataIndex: "trade",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-medium",
                title: <Translate content="exchange.borrow_short" />,
                dataIndex: "borrow",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-medium",
                title: <Translate content="account.settle" />,
                dataIndex: "settle",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-medium",
                title: <Translate content="modal.reserve.submit" />,
                dataIndex: "burn",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                className: "column-hide-medium",
                title: (
                    <Translate
                        content={
                            shownAssets == "active"
                                ? "exchange.hide"
                                : "account.perm.show"
                        }
                    />
                ),
                dataIndex: "hide",
                align: "center",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            }
        ];
        headerItems.forEach(item => {
            if (item.dataIndex == this.state.portfolioSort) {
                item.defaultSortOrder = this.state.portfolioSortDirection;
            }
        });
        return headerItems;
    }

    _sumCollateralBalances(balances) {
        if (!balances || balances.length == 0) return 0;
        let sum = 0;
        balances.forEach(item => {
            sum = sum + +item.get("collateral");
        });
        return sum;
    }

    _sumVestingBalances(balances) {
        if (!balances || balances.length == 0) return 0;
        let sum = 0;
        balances.forEach(item => {
            sum = sum + balanceToAsset(item).amount;
        });
        return sum;
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
        (balanceList || []).forEach(balance => {
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
                <Link
                    to={`/market/${asset.get("symbol")}_${preferredMarket}`}
                    onClick={() => MarketsActions.switchMarket()}
                >
                    <Icon
                        name="trade"
                        title="icons.trade.trade"
                        className="icon-14px"
                    />
                </Link>
            ) : notCorePrefUnit ? (
                <Link
                    to={`/market/${asset.get("symbol")}_${preferredUnit}`}
                    onClick={() => MarketsActions.switchMarket()}
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

            const includeAsset = !hiddenAssets.includes(asset_type);
            const hasBalance = !!balanceObject.get("balance");

            // Vesting balances
            let vestingBalances = [];

            const vbs = this.props.account.get("vesting_balances");
            vbs.forEach(vb => {
                let vestingObject = ChainStore.getObject(vb);
                if (
                    vestingObject.getIn(["balance", "asset_id"]) ===
                    asset.get("id")
                ) {
                    if (+vestingObject.getIn(["balance", "amount"]) > 0) {
                        vestingBalances.push(vestingObject);
                    }
                }
            });

            // Collateral
            let collateralBalances = [];

            (this.props.callOrders || []).forEach(order => {
                let collateralObject = ChainStore.getObject(order);
                if (
                    collateralObject.getIn([
                        "call_price",
                        "base",
                        "asset_id"
                    ]) === asset.get("id")
                ) {
                    if (+collateralObject.get("collateral") > 0) {
                        collateralBalances.push(collateralObject);
                    }
                }
            });

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

            /* Asset and Backing Asset Prefixes */
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

            if (isBitAsset) {
                const globally_settled =
                    asset.get("bitasset").get("settlement_fund") > 0;
                const isPrediction = asset.getIn([
                    "bitasset",
                    "is_prediction_market"
                ]);
                if (globally_settled) {
                    settlePriceTitle = "tooltip.global_settle";
                } else if (isPrediction) {
                    settlePriceTitle = "tooltip.settle_market_prediction";
                } else {
                    settlePriceTitle = "tooltip.settle";
                }
                settleLink =
                    isPrediction && !globally_settled ? (
                        <AntIcon type={"question-circle"} />
                    ) : (
                        <a
                            onClick={this._onSettleAsset.bind(
                                this,
                                asset.get("id")
                            )}
                        >
                            <Icon
                                name="settle"
                                title="icons.settle"
                                className="icon-14px"
                            />
                        </a>
                    );
            }

            let preferredAsset = ChainStore.getAsset(preferredUnit);

            let marketId = asset.get("symbol") + "_" + preferredUnit;
            let currentMarketStats = this.props.allMarketStats.get(marketId);
            this.changeRefs[asset.get("symbol")] =
                currentMarketStats && currentMarketStats.change
                    ? currentMarketStats.change
                    : 0;
            const totalValue =
                balanceToAsset(balanceObject).amount +
                (orders[asset.get("id")] ? orders[asset.get("id")] : 0) +
                this._sumVestingBalances(vestingBalances);

            balances.push({
                key: asset.get("symbol"),
                adds: {
                    balanceObject: balanceObject,
                    preferredAsset: preferredAsset,
                    asset: asset
                },
                asset: asset,
                balance: balanceObject,
                price: "dummy",
                inOrders: orders[asset.get("id")],
                inVesting: vestingBalances,
                inCollateral: collateralBalances,
                hour24: (
                    <Market24HourChangeComponent
                        base={asset.get("id")}
                        quote={preferredUnit}
                        marketId={marketId}
                        hide_symbols
                    />
                ),
                value: totalValue,
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
                                onClick={() => MarketsActions.switchMarket()}
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
                                asset: asset,
                                balance: emptyCell,
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
                accountObj={this.state.borrow && this.state.borrow.account}
                quoteAssetObj={
                    this.state.borrow && this.state.borrow.quoteAsset
                }
                backingAssetObj={
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

        const balanceRows = this._renderBalances(
            this.props.balanceList,
            this.props.optionalAssets,
            this.props.visible
        );
        const atLeastOneHas = {};
        balanceRows.forEach(_item => {
            if (!!_item.buy && _item.buy !== "-") {
                atLeastOneHas.buy = true;
            }
            if (!!_item.deposit && _item.deposit !== "-") {
                if (_item.key == "BTS" && GatewayStore.anyAllowed()) {
                    atLeastOneHas.depositOnlyBTS =
                        _item.key == "BTS" && !atLeastOneHas.deposit;
                    atLeastOneHas.deposit = true;
                }
            }
            if (!!_item.withdraw && _item.withdraw !== "-") {
                atLeastOneHas.withdraw = true;
            }
        });

        return (
            <div>
                <CustomTable
                    className="table dashboard-table table-hover"
                    rows={balanceRows}
                    header={this.getHeader(atLeastOneHas)}
                    label="utility.total_x_assets"
                    extraRow={this.props.extraRow}
                    viewSettingsKey="portfolioColumns"
                    allowCustomization={true}
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
                </CustomTable>
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
