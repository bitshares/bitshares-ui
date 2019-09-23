import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetUpdateFeedProducers = ({op, changeColor, fromComponent}) => {
    changeColor("warning");

    if (fromComponent === "proposed_operation") {
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
    } else {
        return (
            <span>
                <TranslateWithLinks
                    string="operation.asset_update_feed_producers"
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
            </span>
        );
    }
};
