import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetSettle = ({op, changeColor}) => {
    changeColor("warning");

    return (
        <span>
            <TranslateWithLinks
                string="proposal.asset_settle"
                keys={[
                    {
                        type: "account",
                        value: op[1].account,
                        arg: "account"
                    },
                    {
                        type: "amount",
                        value: op[1].amount,
                        arg: "amount"
                    }
                ]}
            />
        </span>
    );
};
