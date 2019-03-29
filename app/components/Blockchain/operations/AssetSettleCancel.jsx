import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetSettleCancel = ({op}) => {
    return (
        <TranslateWithLinks
            string="operation.asset_settle_cancel"
            keys={[
                {
                    type: "account",
                    value: op[1].account,
                    arg: "account"
                },
                {type: "amount", value: op[1].amount, arg: "amount"}
            ]}
        />
    );
};
