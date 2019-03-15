import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetReserve = ({op}) => {
    return (
        <span>
            <TranslateWithLinks
                string="proposal.asset_reserve"
                keys={[
                    {
                        type: "account",
                        value: op[1].payer,
                        arg: "account"
                    },
                    {
                        type: "amount",
                        value: op[1].amount_to_reserve,
                        arg: "amount"
                    }
                ]}
            />
        </span>
    );
};
