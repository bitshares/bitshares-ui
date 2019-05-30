import React from "react";
import BindToChainState from "../../Utility/BindToChainState";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetClaimFees = ({op, changeColor, linkToAccount}) => {
    changeColor("success");
    op[1].amount_to_claim.amount = parseInt(op[1].amount_to_claim.amount, 10);

    return (
        <span>
            {linkToAccount(op[1].issuer)}
            &nbsp;
            <BindToChainState.Wrapper asset={op[1].amount_to_claim.asset_id}>
                {({asset}) => (
                    <TranslateWithLinks
                        string="transaction.asset_claim_fees"
                        keys={[
                            {
                                type: "amount",
                                value: op[1].amount_to_claim,
                                arg: "balance_amount"
                            },
                            {
                                type: "asset",
                                value: asset.get("id"),
                                arg: "asset"
                            }
                        ]}
                    />
                )}
            </BindToChainState.Wrapper>
        </span>
    );
};
