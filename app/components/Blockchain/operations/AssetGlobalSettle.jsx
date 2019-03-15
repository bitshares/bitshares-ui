import React from "react";
import Translate from "react-translate-component";
import FormattedPrice from "../../Utility/FormattedPrice";

export const AssetGlobalSettle = ({op, changeColor}) => {
    changeColor("warning");

    return (
        <span>
            <Translate
                component="span"
                content="proposal.asset_global_settle"
            />
            &nbsp;
            {this.linkToAsset(op[1].asset_to_settle)}
            &nbsp;
            <Translate component="span" content="proposal.at" />
            &nbsp;
            <FormattedPrice
                style={{fontWeight: "bold"}}
                quote_amount={op[1].settle_price.quote.amount}
                quote_asset={op[1].settle_price.quote.asset_id}
                base_asset={op[1].settle_price.base.asset_id}
                base_amount={op[1].settle_price.base.amount}
            />
        </span>
    );
};
