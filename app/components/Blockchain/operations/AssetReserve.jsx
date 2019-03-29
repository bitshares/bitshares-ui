import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetReserve = ({op, fromComponent}) => {
    return (
        <span>
            <TranslateWithLinks
                string={
                    fromComponent === "proposed_operation"
                        ? "proposal.asset_reserve"
                        : "operation.asset_reserve"
                }
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
