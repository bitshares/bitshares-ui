import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetUpdate = ({op, changeColor, fromComponent}) => {
    changeColor("warning");

    return (
        <TranslateWithLinks
            string={
                fromComponent === "proposed_operation"
                    ? "proposal.asset_update"
                    : "operation.asset_update"
            }
            keys={[
                {
                    type: "account",
                    value: op[1].issuer,
                    arg: "account"
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
