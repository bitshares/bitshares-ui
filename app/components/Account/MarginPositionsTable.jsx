import React from "react";
import MarginPosition from "./MarginPosition";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetWrapper from "../Utility/AssetWrapper";
import {ChainStore} from "tuscjs";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import utils from "common/utils";

import TranslateWithLinks from "../Utility/TranslateWithLinks";
import Immutable from "immutable";
import {Popover} from "bitshares-ui-style-guide";

const alignRight = {textAlign: "right"};
const alignLeft = {textAlign: "left"};

/**
 * Renders whole margin list including call orders and placeholders
 */
class ListGenerator extends React.Component {
    static propTypes = {
        callOrders: ChainTypes.ChainObjectsList
    };

    constructor(props) {
        super(props);

        this.state = {
            assetsPropsCount: 0,
            ordersJson: ""
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        // if we got new bitasset info
        // or call orders changed
        // then recalculate "cache" of maring items

        const callOrdersJson = JSON.stringify(nextProps.callOrders);

        if (
            prevState == null ||
            prevState.assetsPropsCount != nextProps.bitAssets.length ||
            prevState.ordersJson != callOrdersJson
        ) {
            let assets = new Array();
            // construct map of bitassets
            let assetsMap = {};
            // index to track asset info
            let index = 0;

            nextProps.bitAssets.forEach(o => {
                assetsMap[o.get("id")] = index++;
                assets.push({
                    asset: o,
                    has_margin_order: false
                });
            });

            if (nextProps.callOrders.length > 0) {
                // add to iterated bitasets items that wasn't listed by default (component's callOrders prop)
                nextProps.callOrders.forEach(o => {
                    // sometimes we get undefined resonses on very first api requests
                    if (!!o) {
                        let assetId = o.getIn([
                            "call_price",
                            "quote",
                            "asset_id"
                        ]);

                        if (assetsMap[assetId] == null) {
                            let newAssetInfo = ChainStore.getObject(assetId);
                            if (typeof newAssetInfo != "undefined") {
                                assetsMap[assetId] = index++;
                                assets.push({
                                    asset: newAssetInfo,
                                    has_margin_order: true,
                                    order: o
                                });
                            }
                        } else {
                            // mark as margin order
                            assets[assetsMap[assetId]].has_margin_order = true;
                            assets[assetsMap[assetId]].order = o;
                        }
                    }
                });
            }

            return {
                assetsPropsCount: nextProps.bitAssets.length,
                assets: assets,
                ordersJson: callOrdersJson
            };
        }

        return prevState;
    }

    render() {
        let {account} = this.props;

        let rows = this.state.assets
            .sort((a, b) => {
                // a,b - order ChainObject's
                // could be done via component's property `order_by`

                // if both have an order, sort by debt
                if (a.has_margin_order && b.has_margin_order) {
                    return b.order.get("debt") - a.order.get("debt");
                } else if (a.has_margin_order || b.has_margin_order) {
                    // having an order goes above having no order

                    return a.has_margin_order ? -1 : 1;
                } else {
                    // if both have no order, sort by symbol

                    let aName = utils.replaceName(a.asset);
                    let bName = utils.replaceName(b.asset);

                    let aSymbol =
                        (aName.prefix != null ? aName.prefix : "") + aName.name;
                    let bSymbol =
                        (bName.prefix != null ? bName.prefix : "") + bName.name;

                    return aSymbol.localeCompare(bSymbol);
                }
            })
            .map(a => {
                let debtAsset,
                    collateralAsset,
                    order_id = null;

                // user has margin on this asset
                if (a.has_margin_order) {
                    let order = a.order;

                    debtAsset = order.getIn([
                        "call_price",
                        "quote",
                        "asset_id"
                    ]);
                    collateralAsset = order.getIn([
                        "call_price",
                        "base",
                        "asset_id"
                    ]);

                    order_id = order.get("id");
                } else {
                    debtAsset = a.asset.get("id");
                    collateralAsset = a.asset.getIn([
                        "bitasset",
                        "options",
                        "short_backing_asset"
                    ]);
                }

                return (
                    <MarginPosition
                        key={a.asset.get("id")}
                        object={order_id}
                        account={account}
                        debtAsset={debtAsset}
                        collateralAsset={collateralAsset}
                        {...this.props}
                    />
                );
            });

        return <tbody>{rows}</tbody>;
    }
}

ListGenerator = BindToChainState(ListGenerator);
ListGenerator = AssetWrapper(ListGenerator, {
    propNames: ["bitAssets"],
    defaultProps: {
        bitAssets: [
            "1.3.113",
            "1.3.120",
            "1.3.121",
            "1.3.1325",
            "1.3.105",
            "1.3.106",
            "1.3.103"
        ]
    },
    asList: true
});

const MarginPositionsTable = ({
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
                        <Popover
                            placement="top"
                            title={counterpart.translate(
                                "header.collateral_ratio"
                            )}
                            content={counterpart.translate(
                                "tooltip.coll_ratio"
                            )}
                        >
                            <Translate content="borrow.coll_ratio" />
                        </Popover>
                    </th>
                    <th>
                        <Popover
                            placement="top"
                            content={
                                <div style={{width: "600px"}}>
                                    {counterpart.translate(
                                        "borrow.target_collateral_ratio_explanation"
                                    )}
                                </div>
                            }
                            title={counterpart.translate(
                                "borrow.target_collateral_ratio"
                            )}
                        >
                            <Translate content="borrow.target_collateral_ratio_short" />
                        </Popover>
                    </th>
                    <th style={alignRight}>
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
                        <Popover
                            placement="top"
                            content={counterpart.translate(
                                "tooltip.call_price"
                            )}
                        >
                            <Translate content="exchange.call" />
                        </Popover>
                    </th>
                    <th style={alignRight} className="column-hide-small">
                        <Popover
                            placement="top"
                            content={counterpart.translate(
                                "tooltip.feed_price"
                            )}
                        >
                            <Translate content="exchange.feed_price" />
                        </Popover>
                    </th>
                    <th className="column-hide-small" style={alignLeft}>
                        <Translate content="explorer.assets.units" />
                    </th>
                    <th style={{textAlign: "center"}}>
                        <Translate content="exchange.market" />
                    </th>
                    <th>
                        <Translate content="borrow.adjust_short" />
                    </th>
                    <th>
                        <Translate content="transfer.close" />
                    </th>
                </tr>
            </thead>
            <ListGenerator
                account={account}
                callOrders={Immutable.List(callOrders)}
            />
            <tbody>{children}</tbody>
        </table>
    );
};

export default MarginPositionsTable;
