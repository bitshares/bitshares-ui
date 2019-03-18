import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";
import FormattedPrice from "../../Utility/FormattedPrice";

export const FillOrder = ({changeColor, op, linkToAccount}) => {
    changeColor("success");
    const o = op[1];
    return (
        <span>
            {linkToAccount(op.account_id)}
            &nbsp;
            <Translate component="span" content="proposal.paid" />
            &nbsp;
            <FormattedAsset
                style={{fontWeight: "bold"}}
                amount={op.pays.amount}
                asset={op.pays.asset_id}
            />
            &nbsp;
            <Translate component="span" content="proposal.obtain" />
            &nbsp;
            <FormattedAsset
                style={{fontWeight: "bold"}}
                amount={op.receives.amount}
                asset={op.receives.asset_id}
            />
            &nbsp;
            <Translate component="span" content="proposal.at" />
            &nbsp;
            <FormattedPrice
                base_asset={o.pays.asset_id}
                base_amount={o.pays.amount}
                quote_asset={o.receives.asset_id}
                quote_amount={o.receives.amount}
            />
        </span>
    );
};
