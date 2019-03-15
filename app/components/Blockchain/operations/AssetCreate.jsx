import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetCreate = ({op, changeColor}) => {
    changeColor("warning");

    return (
        <TranslateWithLinks
            string="proposal.asset_create"
            keys={[
                {
                    type: "account",
                    value: op[1].issuer,
                    arg: "account"
                }
            ]}
            params={{
                asset: op[1].symbol
            }}
        />
    );
};
