import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetUpdateFeedProducers = ({op, changeColor}) => {
    changeColor("warning");

    return (
        <TranslateWithLinks
            string="proposal.feed_producer"
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
