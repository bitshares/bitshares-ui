import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const OverrideTransfer = ({op}) => {
    return (
        <TranslateWithLinks
            string="proposal.override_transfer"
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
