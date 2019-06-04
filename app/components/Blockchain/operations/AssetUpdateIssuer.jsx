import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetUpdateIssuer = ({op}) => {
    return (
        <TranslateWithLinks
            string="operation.asset_update_issuer"
            keys={[
                {
                    type: "account",
                    value: op[1].issuer,
                    arg: "from_account"
                },
                {
                    type: "account",
                    value: op[1].new_issuer,
                    arg: "to_account"
                },
                {
                    type: "asset",
                    value: op[1].asset_to_update,
                    arg: "asset"
                }
            ]}
        />
    );
};
