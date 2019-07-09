import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const BidCollateral = ({op}) => {
    return (
        <TranslateWithLinks
            string="operation.bid_collateral"
            keys={[
                {
                    type: "account",
                    value: op[1].bidder,
                    arg: "bid_account"
                },
                {
                    type: "amount",
                    value: op[1].additional_collateral,
                    arg: "collateral"
                },
                {
                    type: "amount",
                    value: op[1].debt_covered,
                    arg: "debt"
                }
            ]}
        />
    );
};
