import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetClaimPool = ({op}) => {
    return (
        <TranslateWithLinks
            string="operation.asset_claim_pool"
            keys={[
                {
                    type: "account",
                    value: op[1].issuer,
                    arg: "account"
                },
                {
                    type: "asset",
                    value: op[1].asset_id,
                    arg: "asset"
                },
                {
                    type: "amount",
                    value: op[1].amount_to_claim,
                    arg: "amount"
                }
            ]}
        />
    );
};
