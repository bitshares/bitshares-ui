import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const OverrideTransfer = ({op, fromComponent}) => {
    return (
        <TranslateWithLinks
            string={
                fromComponent === "proposed_operation"
                    ? "proposal.override_transfer"
                    : "operation.override_transfer"
            }
            keys={[
                {
                    type: "account",
                    value: op[1].issuer,
                    arg: "issuer"
                },
                {type: "account", value: op[1].from, arg: "from"},
                {type: "account", value: op[1].to, arg: "to"},
                {type: "amount", value: op[1].amount, arg: "amount"}
            ]}
        />
    );
};
