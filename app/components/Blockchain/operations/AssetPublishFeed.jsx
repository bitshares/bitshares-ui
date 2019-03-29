import React from "react";
import Translate from "react-translate-component";
import FormattedPrice from "../../Utility/FormattedPrice";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetPublishFeed = ({
    op,
    changeColor,
    linkToAccount,
    fromComponent
}) => {
    changeColor("warning");
    if (fromComponent === "proposed_operation") {
        return (
            <span>
                {linkToAccount(op[1].publisher)}
                &nbsp;
                <Translate component="span" content="proposal.publish_feed" />
                &nbsp;
                <FormattedPrice
                    base_asset={op[1].feed.settlement_price.base.asset_id}
                    quote_asset={op[1].feed.settlement_price.quote.asset_id}
                    base_amount={op[1].feed.settlement_price.base.amount}
                    quote_amount={op[1].feed.settlement_price.quote.amount}
                />
            </span>
        );
    } else {
        return (
            <span>
                <TranslateWithLinks
                    string="operation.publish_feed"
                    keys={[
                        {
                            type: "account",
                            value: op[1].publisher,
                            arg: "account"
                        },
                        {
                            type: "price",
                            value: op[1].feed.settlement_price,
                            arg: "price"
                        }
                    ]}
                />
            </span>
        );
    }
};
