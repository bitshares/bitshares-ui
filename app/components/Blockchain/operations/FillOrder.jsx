/* eslint-disable react/display-name */
import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";
import FormattedPrice from "../../Utility/FormattedPrice";
import BindToChainState from "../../Utility/BindToChainState";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";
import marketUtils from "common/market_utils";

export const FillOrder = ({
    changeColor,
    op,
    linkToAccount,
    marketDirections,
    fromComponent
}) => {
    changeColor("success");
    const o = op[1];
    if (fromComponent === "proposed_operation") {
        return (
            <span>
                {linkToAccount(op.account_id)}
                &nbsp;
                <Translate component="span" content="proposal.paid" />
                &nbsp;
                <FormattedAsset
                    style={{fontWeight: "bold"}}
                    amount={op.pays.amount}
                    asset={op.pays.asset_id}
                />
                &nbsp;
                <Translate component="span" content="proposal.obtain" />
                &nbsp;
                <FormattedAsset
                    style={{fontWeight: "bold"}}
                    amount={op.receives.amount}
                    asset={op.receives.asset_id}
                />
                &nbsp;
                <Translate component="span" content="proposal.at" />
                &nbsp;
                <FormattedPrice
                    base_asset={o.pays.asset_id}
                    base_amount={o.pays.amount}
                    quote_asset={o.receives.asset_id}
                    quote_amount={o.receives.amount}
                />
            </span>
        );
    } else {
        return (
            <span>
                <BindToChainState.Wrapper
                    base={o.receives.asset_id}
                    quote={o.pays.asset_id}
                >
                    {({base, quote}) => {
                        const {
                            marketName,
                            first,
                            second
                        } = marketUtils.getMarketName(base, quote);
                        const inverted = marketDirections.get(marketName);
                        const isBid =
                            o.pays.asset_id ===
                            (inverted ? first.get("id") : second.get("id"));

                        let priceBase = isBid ? o.receives : o.pays;
                        let priceQuote = isBid ? o.pays : o.receives;
                        let amount = isBid ? o.receives : o.pays;
                        let receivedAmount =
                            o.fee.asset_id === amount.asset_id
                                ? amount.amount - o.fee.amount
                                : amount.amount;

                        return (
                            <TranslateWithLinks
                                string={`operation.fill_order_${
                                    isBid ? "buy" : "sell"
                                }`}
                                keys={[
                                    {
                                        type: "account",
                                        value: op[1].account_id,
                                        arg: "account"
                                    },
                                    {
                                        type: "amount",
                                        value: {
                                            amount: receivedAmount,
                                            asset_id: amount.asset_id
                                        },
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
                                    order: o.order_id.substring(4)
                                }}
                            />
                        );
                    }}
                </BindToChainState.Wrapper>
            </span>
        );
    }
};
