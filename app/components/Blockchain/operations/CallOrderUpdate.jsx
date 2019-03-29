import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const CallOrderUpdate = ({op, changeColor, fromComponent}) => {
    changeColor("warning");

    return (
        <span>
            <TranslateWithLinks
                string={
                    fromComponent === "proposed_operation"
                        ? "proposal.call_order_update"
                        : "operation.call_order_update"
                }
                keys={[
                    {
                        type: "account",
                        value: op[1].funding_account,
                        arg: "account"
                    },
                    {
                        type: "asset",
                        value: op[1].delta_debt.asset_id,
                        arg: "debtSymbol"
                    },
                    {
                        type: "amount",
                        value: op[1].delta_debt,
                        arg: "debt"
                    },
                    {
                        type: "amount",
                        value: op[1].delta_collateral,
                        arg: "collateral"
                    }
                ]}
            />
        </span>
    );
};
