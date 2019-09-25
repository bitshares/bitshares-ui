import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetName from "../Utility/AssetName";
import BorrowModal from "../Modal/BorrowModal";
import WalletApi from "api/WalletApi";
import {ChainStore} from "tuscjs";
import WalletDb from "stores/WalletDb";
import utils from "common/utils";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import {List} from "immutable";
import {Link} from "react-router-dom";
import {Tooltip, Icon as AntIcon} from "bitshares-ui-style-guide";
import asset_utils from "../../lib/common/asset_utils";

const alignRight = {textAlign: "right"};
const alignLeft = {textAlign: "left"};
/**
 *  Given a collateral position object (call order) and account,
 *  display it in a pretty way, in case no call order id was provided - display a placeholder
 *
 *  Expects property, 'object' which should be a call order id
 *  and another property called 'account' which should be an
 *  account
 */

class MarginPosition extends React.Component {
    static propTypes = {
        object: ChainTypes.ChainObject,
        debtAsset: ChainTypes.ChainAsset.isRequired,
        collateralAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        tempComponent: "tr"
    };

    constructor(props) {
        super(props);

        let has_order = props.object != null;

        this.state = {
            isBorrowModalVisible: false,
            modalRef:
                "cp_modal_" +
                (has_order
                    ? this.props.object.getIn([
                          "call_price",
                          "quote",
                          "asset_id"
                      ])
                    : this.props.debtAsset.get("id")),
            hasOrder: has_order
        };
    }

    showBorrowModal() {
        this.setState({
            isBorrowModalVisible: true
        });
    }

    hideBorrowModal() {
        this.setState({
            isBorrowModalVisible: false
        });
    }

    _onUpdatePosition(e) {
        e.preventDefault();
        this.refs[this.state.modalRef].show();
    }

    _getFeedPrice() {
        if (!this.props) {
            return 1;
        }

        return (
            1 /
            utils.get_asset_price(
                asset_utils
                    .extractRawFeedPrice(this.props.debtAsset)
                    .getIn(["quote", "amount"]),
                this.props.collateralAsset,
                asset_utils
                    .extractRawFeedPrice(this.props.debtAsset)
                    .getIn(["base", "amount"]),
                this.props.debtAsset
            )
        );
    }

    _onClosePosition(e) {
        e.preventDefault();
        let tr = WalletApi.new_transaction();

        tr.add_type_operation("call_order_update", {
            fee: {
                amount: 0,
                asset_id: 0
            },
            funding_account: this.props.object.get("borrower"),
            delta_collateral: {
                amount: -this.props.object.get("collateral"),
                asset_id: this.props.object.getIn([
                    "call_price",
                    "base",
                    "asset_id"
                ])
            },
            delta_debt: {
                amount: -this.props.object.get("debt"),
                asset_id: this.props.object.getIn([
                    "call_price",
                    "quote",
                    "asset_id"
                ])
            }
        });

        WalletDb.process_transaction(tr, null, true);
    }

    // how many units of the debt asset the borrower has
    // in his/her wallet. This has nothing to do with
    // how many of the asset the borrower has borrowed.
    _getBalance() {
        let account = this.props.account;

        // the debt asset id which we want to display
        let row_asset_id = null;

        // in case we displaying a margin position, not a placeholder
        if (this.props.object != null) {
            row_asset_id = this.props.object.getIn([
                "call_price",
                "quote",
                "asset_id"
            ]);
        } else {
            row_asset_id = this.props.debtAsset.get("id");
        }

        let account_balances = account.get("balances");

        let balance = 0;

        // for every debt the account has, we iterate
        // through every balance the user has
        if (account_balances) {
            account_balances.forEach((a, asset_type) => {
                if (asset_type == row_asset_id) {
                    let balanceObject = ChainStore.getObject(a);

                    // get the balance
                    balance = balanceObject.get("balance");
                }
            });
        }

        // it's possible that the account doesn't hold
        // any of the asset here
        return balance;
    }

    _getCollateralRatio() {
        const co = this.props.object.toJS();
        const c = utils.get_asset_amount(
            co.collateral,
            this.props.collateralAsset
        );
        const d = utils.get_asset_amount(co.debt, this.props.debtAsset);
        return c / (d / this._getFeedPrice());
    }

    _getMR() {
        return (
            this.props.debtAsset.getIn([
                "bitasset",
                "current_feed",
                "maintenance_collateral_ratio"
            ]) / 1000
        );
    }

    _getStatusClass() {
        let cr = this._getCollateralRatio();
        const mr = this._getMR();

        if (isNaN(cr)) return null;
        if (cr < mr) {
            return "danger";
        } else if (cr < mr + 0.5) {
            return "warning";
        } else {
            return "";
        }
    }

    _getCRTip() {
        const statusClass = this._getStatusClass();
        const mr = this._getMR();
        if (!statusClass || statusClass === "") return null;

        if (statusClass === "danger") {
            return counterpart.translate("tooltip.cr_danger", {mr});
        } else if (statusClass === "warning") {
            return counterpart.translate("tooltip.cr_warning", {mr});
        } else {
            return null;
        }
    }

    _getTargetCollateralRatio() {
        const co = this.props.object && this.props.object.toJS();

        return co && !isNaN(co.target_collateral_ratio)
            ? co.target_collateral_ratio / 1000
            : 0;
    }

    render() {
        let {debtAsset, collateralAsset, object} = this.props;

        let has_order = object != null;
        const balance = this._getBalance();
        let co = has_order ? object.toJS() : null;

        let {isBitAsset} = utils.replaceName(this.props.debtAsset);

        let settlement_fund = this.props.debtAsset.getIn([
            "bitasset",
            "settlement_fund"
        ]);

        let mcr = this.props.debtAsset.getIn([
            "bitasset",
            "current_feed",
            "maintenance_collateral_ratio"
        ]);

        let hasGlobalSettlement = settlement_fund > 0 ? true : false;

        const balance_asset = has_order
            ? co.call_price.quote.asset_id
            : debtAsset.get("id");
        const debt_amount = has_order ? co.debt : 0;
        const collateral_amount = has_order ? co.collateral : 0;
        const collateral_asset = has_order
            ? co.call_price.base.asset_id
            : collateralAsset.get("id");
        const target_collateral_ratio = this._getTargetCollateralRatio();

        return (
            <tr className="margin-row">
                <td style={alignLeft}>
                    <Link to={`/asset/${debtAsset.get("symbol")}`}>
                        <AssetName noTip name={debtAsset.get("symbol")} />
                    </Link>
                </td>
                <td style={alignRight}>
                    <FormattedAsset
                        amount={balance}
                        asset={balance_asset}
                        hide_asset
                    />
                </td>
                <td style={alignRight}>
                    <FormattedAsset
                        amount={debt_amount}
                        asset={balance_asset}
                        hide_asset
                    />
                </td>
                <td style={alignRight} className="column-hide-medium">
                    <FormattedAsset
                        decimalOffset={3}
                        amount={collateral_amount}
                        asset={collateral_asset}
                    />
                </td>
                {has_order ? (
                    <td
                        data-place="bottom"
                        data-tip={this._getCRTip()}
                        className={"center-content " + this._getStatusClass()}
                    >
                        {utils.format_number(this._getCollateralRatio(), 2)}
                    </td>
                ) : (
                    <td />
                )}
                <td>
                    {target_collateral_ratio
                        ? utils.format_number(target_collateral_ratio, 2)
                        : null}
                </td>
                <td style={alignRight}>
                    {has_order ? (
                        <TotalBalanceValue
                            noTip
                            balances={List()}
                            debt={{[debtAsset.get("id")]: co.debt}}
                            collateral={{
                                [collateralAsset.get("id")]: parseInt(
                                    co.collateral,
                                    10
                                )
                            }}
                            hide_asset
                        />
                    ) : null}
                </td>
                <td style={alignRight} className={"column-hide-small"}>
                    {has_order ? (
                        <FormattedPrice
                            base_amount={collateral_amount}
                            base_asset={collateralAsset.get("id")}
                            quote_amount={debt_amount * (mcr / 1000)}
                            quote_asset={debtAsset.get("id")}
                            hide_symbols
                        />
                    ) : null}
                </td>
                <td style={alignRight} className={"column-hide-small"}>
                    {has_order ? (
                        <FormattedPrice
                            base_amount={asset_utils
                                .extractRawFeedPrice(debtAsset)
                                .getIn(["base", "amount"])}
                            base_asset={co.call_price.quote.asset_id}
                            quote_amount={asset_utils
                                .extractRawFeedPrice(debtAsset)
                                .getIn(["quote", "amount"])}
                            quote_asset={co.call_price.base.asset_id}
                            hide_symbols
                        />
                    ) : null}
                </td>
                <td
                    className={"center-content column-hide-small"}
                    style={alignLeft}
                >
                    {has_order ? (
                        <FormattedPrice
                            base_amount={co.call_price.base.amount}
                            base_asset={co.call_price.base.asset_id}
                            quote_amount={co.call_price.quote.amount}
                            quote_asset={co.call_price.quote.asset_id}
                            hide_value
                        />
                    ) : null}
                </td>
                <td style={{textAlign: "center"}}>
                    <Link
                        to={`/market/${debtAsset.get(
                            "symbol"
                        )}_${collateralAsset.get("symbol")}`}
                    >
                        <Icon
                            name="trade"
                            title="icons.trade.trade"
                            className="icon-14px"
                            style={{marginRight: 5}}
                        />
                    </Link>
                </td>
                <td>
                    {hasGlobalSettlement ? (
                        <Tooltip
                            placement={"left"}
                            title={counterpart.translate(
                                "tooltip.borrow_disabled",
                                {
                                    asset: isBitAsset
                                        ? "bit" + `${debtAsset.get("symbol")}`
                                        : `${debtAsset.get("symbol")}`
                                }
                            )}
                        >
                            <div style={{paddingBottom: 5}}>
                                <AntIcon type={"question-circle"} />
                            </div>
                        </Tooltip>
                    ) : (
                        <Tooltip
                            placement={"left"}
                            title={counterpart.translate(
                                "tooltip.update_position"
                            )}
                        >
                            <div style={{paddingBottom: 5}}>
                                <a onClick={this._onUpdatePosition.bind(this)}>
                                    <Icon
                                        name="adjust"
                                        title="icons.adjust"
                                        className="icon-14px rotate90"
                                    />
                                </a>
                            </div>
                        </Tooltip>
                    )}
                </td>
                <td>
                    {has_order ? (
                        <div
                            data-place="left"
                            data-tip={counterpart.translate(
                                "tooltip.close_position",
                                {
                                    amount: utils.get_asset_amount(
                                        co.debt,
                                        this.props.debtAsset
                                    ),
                                    asset: debtAsset.get("symbol")
                                }
                            )}
                            style={{paddingBottom: 5}}
                        >
                            <a onClick={this._onClosePosition.bind(this)}>
                                <Icon
                                    name="cross-circle"
                                    title="icons.cross_circle.close_position"
                                    className="icon-14px"
                                />
                            </a>
                        </div>
                    ) : null}
                    {debtAsset ? (
                        <BorrowModal
                            visible={this.state.isBorrowModalVisible}
                            showModal={this.showBorrowModal.bind(this)}
                            hideModal={this.hideBorrowModal.bind(this)}
                            ref={this.state.modalRef}
                            modalId={this.state.modalRef}
                            quote_asset={balance_asset}
                            backing_asset={debtAsset.getIn([
                                "bitasset",
                                "options",
                                "short_backing_asset"
                            ])}
                            account={this.props.account}
                        />
                    ) : null}
                </td>
            </tr>
        );
    }
}
MarginPosition = BindToChainState(MarginPosition);

export default MarginPosition;
