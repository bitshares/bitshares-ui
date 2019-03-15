import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const LimitOrderCreate = ({op, changeColor}) => {
    changeColor("warning");
    let isAsk = market_utils.isAskOp(op[1]);

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
};
