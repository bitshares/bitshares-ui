/* eslint-disable react/display-name */
import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";
import BindToChainState from "../../Utility/BindToChainState";
import marketUtils from "common/market_utils";
export const LimitOrderCreate = ({
    op,
    changeColor,
    fromComponent,
    marketDirections,
    result
}) => {
    changeColor("warning");

    if (fromComponent === "proposed_operation") {
        let isAsk = marketUtils.isAskOp(op[1]);

        return (
            <span>
                <TranslateWithLinks
                    string={
                        isAsk
                            ? "proposal.limit_order_sell"
                            : "proposal.limit_order_buy"
                    }
                    keys={[
                        {
                            type: "account",
                            value: op[1].seller,
                            arg: "account"
                        },
                        {
                            type: "amount",
                            value: isAsk
                                ? op[1].amount_to_sell
                                : op[1].min_to_receive,
                            arg: "amount"
                        },
                        {
                            type: "price",
                            value: {
                                base: isAsk
                                    ? op[1].min_to_receive
                                    : op[1].amount_to_sell,
                                quote: isAsk
                                    ? op[1].amount_to_sell
                                    : op[1].min_to_receive
                            },
                            arg: "price"
                        }
                    ]}
                />
            </span>
        );
    } else {
        let o = op[1];
        return (
            <span>
                <BindToChainState.Wrapper
                    base={o.min_to_receive.asset_id}
                    quote={o.amount_to_sell.asset_id}
                >
                    {({base, quote}) => {
                        const {
                            marketName,
                            first,
                            second
                        } = marketUtils.getMarketName(base, quote);
                        const inverted = marketDirections.get(marketName);

                        const isBid =
                            o.amount_to_sell.asset_id ===
                            (inverted ? first.get("id") : second.get("id"));

                        let priceBase = isBid
                            ? o.amount_to_sell
                            : o.min_to_receive;
                        let priceQuote = isBid
                            ? o.min_to_receive
                            : o.amount_to_sell;
                        const amount = isBid
                            ? op[1].min_to_receive
                            : op[1].amount_to_sell;
                        let orderId = result
                            ? typeof result[1] == "string"
                                ? "#" + result[1].substring(4)
                                : ""
                            : "";

                        return (
                            <TranslateWithLinks
                                string={
                                    isBid
                                        ? "operation.limit_order_buy"
                                        : "operation.limit_order_sell"
                                }
                                keys={[
                                    {
                                        type: "account",
                                        value: op[1].seller,
                                        arg: "account"
                                    },
                                    {
                                        type: "amount",
                                        value: amount,
                                        arg: "amount"
                                    },
                                    {
                                        type: "price",
                                        value: {
                                            base: priceBase,
                                            quote: priceQuote
                                        },
                                        arg: "price"
                                    }
                                ]}
                                params={{
                                    order: orderId
                                }}
                            />
                        );
                    }}
                </BindToChainState.Wrapper>
            </span>
        );
    }
};
