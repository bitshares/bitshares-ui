import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetWrapper from "../Utility/AssetWrapper";
import AssetName from "../Utility/AssetName";
import BorrowModal from "../Modal/BorrowModal";
import WalletApi from "api/WalletApi";
import {ChainStore} from "bitsharesjs/es";
import WalletDb from "stores/WalletDb";
import Translate from "react-translate-component";
import utils from "common/utils";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import {List} from "immutable";
import {Link} from "react-router-dom";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import Immutable from "immutable";

const alignRight = {textAlign: "right"};
const alignLeft = {textAlign: "left"};
/**
 *  Given a collateral position object (call order) and account,
 *  display it in a pretty way
 *
 *  Expects property, 'object' which should be a call order id
 *  and another property called 'account' which should be an
 *  account.
 */

class MarginPosition extends React.Component {
    static propTypes = {
        debtAsset: ChainTypes.ChainAsset.isRequired,
        collateralAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        tempComponent: "tr"
    };

    _onUpdatePosition(e) {
        e.preventDefault();
        let ref =
            "cp_modal_" +
            this.props.object.getIn(["call_price", "quote", "asset_id"]);
        this.refs[ref].show();
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
        let row_asset_id = this.props.object.getIn([
            "call_price",
            "quote",
            "asset_id"
        ]);

        let account_balances = account.get("balances");

        let balance = 0;

        // really this iteration should be called once, and
        // each asset_id matched once with its balance

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

    _getFeedPrice() {
        if (!this.props) {
            return 1;
        }

        return (
            1 /
            utils.get_asset_price(
                this.props.debtAsset.getIn([
                    "bitasset",
                    "current_feed",
                    "settlement_price",
                    "quote",
                    "amount"
                ]),
                this.props.collateralAsset,
                this.props.debtAsset.getIn([
                    "bitasset",
                    "current_feed",
                    "settlement_price",
                    "base",
                    "amount"
                ]),
                this.props.debtAsset
            )
        );
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

    render() {
        let {debtAsset, collateralAsset, object} = this.props;
        const co = object.toJS();
        const cr = this._getCollateralRatio();
        const d = utils.get_asset_amount(co.debt, this.props.debtAsset);
        const balance = this._getBalance();

        const statusClass = this._getStatusClass();

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
                        asset={co.call_price.quote.asset_id}
                        hide_asset
                    />
                </td>
                <td style={alignRight}>
                    <FormattedAsset
                        amount={co.debt}
                        asset={co.call_price.quote.asset_id}
                        hide_asset
                    />
                </td>
                <td style={alignRight} className="column-hide-medium">
                    <FormattedAsset
                        decimalOffset={5}
                        amount={co.collateral}
                        asset={co.call_price.base.asset_id}
                    />
                </td>
                <td
                    data-place="bottom"
                    data-tip={this._getCRTip()}
                    className={"center-content " + statusClass}
                >
                    {utils.format_number(cr, 2)}
                </td>
                <td style={alignRight}>
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
                </td>
                <td style={alignRight} className={"column-hide-small"}>
                    <FormattedPrice
                        base_amount={co.call_price.base.amount}
                        base_asset={co.call_price.base.asset_id}
                        quote_amount={co.call_price.quote.amount}
                        quote_asset={co.call_price.quote.asset_id}
                        hide_symbols
                    />
                </td>
                <td style={alignRight} className={"column-hide-small"}>
                    <FormattedPrice
                        base_amount={debtAsset.getIn([
                            "bitasset",
                            "current_feed",
                            "settlement_price",
                            "base",
                            "amount"
                        ])}
                        base_asset={co.call_price.quote.asset_id}
                        quote_amount={debtAsset.getIn([
                            "bitasset",
                            "current_feed",
                            "settlement_price",
                            "quote",
                            "amount"
                        ])}
                        quote_asset={co.call_price.base.asset_id}
                        hide_symbols
                    />
                </td>
                <td
                    className={"center-content column-hide-small"}
                    style={alignLeft}
                >
                    <FormattedPrice
                        base_amount={co.call_price.base.amount}
                        base_asset={co.call_price.base.asset_id}
                        quote_amount={co.call_price.quote.amount}
                        quote_asset={co.call_price.quote.asset_id}
                        hide_value
                    />
                </td>
                {/* <td><AssetName name={debtAsset.get("symbol")} />/<AssetName name={collateralAsset.get("symbol")} /></td> */}

                <td>
                    <div
                        data-place="left"
                        data-tip={counterpart.translate(
                            "tooltip.update_position"
                        )}
                        style={{paddingBottom: 5}}
                    >
                        <a onClick={this._onUpdatePosition.bind(this)}>
                            <Icon
                                name="adjust"
                                title="icons.adjust"
                                className="icon-14px rotate90"
                            />
                        </a>
                    </div>
                </td>
                <td>
                    <div
                        data-place="left"
                        data-tip={counterpart.translate(
                            "tooltip.close_position",
                            {amount: d, asset: debtAsset.get("symbol")}
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
                    {debtAsset ? (
                        <BorrowModal
                            ref={"cp_modal_" + co.call_price.quote.asset_id}
                            modalId={"cp_modal_" + co.call_price.quote.asset_id}
                            quote_asset={co.call_price.quote.asset_id}
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

class MarginPositionWrapper extends React.Component {
    static propTypes = {
        object: ChainTypes.ChainObject.isRequired
    };

    render() {
        let {object, account} = this.props;
        let debtAsset = object.getIn(["call_price", "quote", "asset_id"]);
        let collateralAsset = object.getIn(["call_price", "base", "asset_id"]);

        return (
            <MarginPosition
                debtAsset={debtAsset}
                collateralAsset={collateralAsset}
                account={account}
                {...this.props}
            />
        );
    }
}

MarginPositionWrapper = BindToChainState(MarginPositionWrapper);

class MarginPositionPlaceHolder extends React.Component {
    static propTypes = {
        debtAsset: ChainTypes.ChainAsset.isRequired,
        collateralAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        tempComponent: "tr"
    };

    _onUpdatePosition(e) {
        e.preventDefault();
        let ref = "cp_modal_" + this.props.debtAsset.get("id");
        this.refs[ref].show();
    }

    _getFeedPrice() {
        if (!this.props) {
            return 1;
        }

        return (
            1 /
            utils.get_asset_price(
                this.props.debtAsset.getIn([
                    "bitasset",
                    "current_feed",
                    "settlement_price",
                    "quote",
                    "amount"
                ]),
                this.props.collateralAsset,
                this.props.debtAsset.getIn([
                    "bitasset",
                    "current_feed",
                    "settlement_price",
                    "base",
                    "amount"
                ]),
                this.props.debtAsset
            )
        );
    }

    render() {
        let {debtAsset, collateralAsset, account} = this.props;

        // get the balance

        // the debt asset id which we want to display
        let row_asset_id = debtAsset.get("id");

        let account_balances = account.get("balances");

        let balance = 0;

        // really this iteration should be called once, and
        // each asset_id matched once with its balance

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
                        asset={debtAsset.get("id")}
                        hide_asset
                    />
                </td>
                <td style={alignRight}>
                    <FormattedAsset
                        amount={0}
                        asset={debtAsset.get("id")}
                        hide_asset
                    />
                </td>
                <td style={alignRight} className="column-hide-medium">
                    <FormattedAsset
                        decimalOffset={5}
                        amount={0}
                        asset={collateralAsset.get("id")}
                    />
                </td>
                <td />
                <td style={alignRight} />
                <td style={alignRight} className={"column-hide-small"} />
                <td style={alignRight} className={"column-hide-small"} />
                <td
                    className={"center-content column-hide-small"}
                    style={alignLeft}
                />
                {/* <td><AssetName name={debtAsset.get("symbol")} />/<AssetName name={collateralAsset.get("symbol")} /></td> */}

                <td>
                    <div
                        data-place="left"
                        data-tip={counterpart.translate(
                            "tooltip.update_position"
                        )}
                        style={{paddingBottom: 5}}
                    >
                        <a onClick={this._onUpdatePosition.bind(this)}>
                            <Icon
                                name="adjust"
                                title="icons.adjust"
                                className="icon-14px rotate90"
                            />
                        </a>
                    </div>
                </td>
                <td>
                    {debtAsset ? (
                        <BorrowModal
                            ref={"cp_modal_" + debtAsset.get("id")}
                            modalId={"cp_modal_" + debtAsset.get("id")}
                            quote_asset={debtAsset.get("id")}
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

MarginPositionPlaceHolder = BindToChainState(MarginPositionPlaceHolder);

class PlaceHolderWrapper extends React.Component {
    static propTypes = {
        callOrders: ChainTypes.ChainObjectsList
    };

    render() {
        let {account, callOrders, bitAssets} = this.props;
        callOrders = callOrders.filter(o => !!o);
        bitAssets = bitAssets.filter(o => !!o);
        if (!bitAssets.length) return null;
        callOrders.forEach(object => {
            /*
            * Existing call orders are already rendered elsewhere, so we filter
            * out assets from the bitAssets list for which the account already
            * has a position
            */
            if (object) {
                let index = bitAssets.findIndex(o => {
                    return (
                        o &&
                        o.get("id") ===
                            object.getIn(["call_price", "quote", "asset_id"])
                    );
                });
                if (index !== -1) {
                    bitAssets.splice(index, 1);
                }
            }
        });

        if (!bitAssets.length) return null;
        let rows = bitAssets.map(a => {
            return (
                <MarginPositionPlaceHolder
                    key={a.get("id")}
                    debtAsset={a.get("id")}
                    collateralAsset={a.getIn([
                        "bitasset",
                        "options",
                        "short_backing_asset"
                    ])}
                    account={account}
                    {...this.props}
                />
            );
        });

        return <tbody>{rows}</tbody>;
    }
}

PlaceHolderWrapper = BindToChainState(PlaceHolderWrapper);
PlaceHolderWrapper = AssetWrapper(PlaceHolderWrapper, {
    propNames: ["bitAssets"],
    defaultProps: {
        bitAssets: [
            "1.3.103",
            "1.3.113",
            "1.3.120",
            "1.3.121",
            "1.3.958",
            "1.3.1325",
            "1.3.1362",
            "1.3.105",
            "1.3.106"
        ]
    },
    asList: true
});

const CollateralTable = ({
    callOrders,
    account,
    className,
    children,
    preferredUnit
}) => {
    return (
        <table className={"table table-hover " + className}>
            <thead>
                <tr>
                    <th style={alignLeft}>
                        <Translate content="explorer.asset.title" />
                    </th>
                    <th style={alignRight}>
                        <Translate content="exchange.balance" />
                    </th>
                    <th style={alignRight}>
                        <Translate content="transaction.borrow_amount" />
                    </th>
                    <th style={alignRight} className="column-hide-medium">
                        <Translate content="transaction.collateral" />
                    </th>
                    <th>
                        <div
                            className="tooltip inline-block"
                            data-place="top"
                            data-tip={counterpart.translate(
                                "tooltip.coll_ratio"
                            )}
                        >
                            <Translate content="borrow.coll_ratio" />
                        </div>
                    </th>
                    <th>
                        <TranslateWithLinks
                            noLink
                            string="account.total"
                            keys={[
                                {
                                    type: "asset",
                                    value: preferredUnit,
                                    arg: "asset"
                                }
                            ]}
                        />
                    </th>
                    <th style={alignRight} className="column-hide-small">
                        <div
                            className="tooltip inline-block"
                            data-place="top"
                            data-tip={counterpart.translate(
                                "tooltip.call_price"
                            )}
                        >
                            <Translate content="exchange.call" />
                        </div>
                    </th>
                    <th style={alignRight} className="column-hide-small">
                        <Translate content="exchange.price" />
                    </th>
                    <th className="column-hide-small" style={alignLeft}>
                        <Translate content="explorer.assets.units" />
                    </th>
                    <th>
                        <Translate content="borrow.adjust_short" />
                    </th>
                    <th>
                        <Translate content="transfer.close" />
                    </th>
                </tr>
            </thead>
            <tbody>
                {callOrders
                    .sort((a, b) => a.split(".")[2] - b.split(".")[2])
                    .map(id => (
                        <MarginPositionWrapper
                            key={id}
                            object={id}
                            account={account}
                        />
                    ))}
            </tbody>
            <PlaceHolderWrapper
                account={account}
                callOrders={Immutable.List(callOrders)}
            />
            <tbody>{children}</tbody>
        </table>
    );
};

export default CollateralTable;
