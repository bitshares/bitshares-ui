import React from "react";
import Translate from "react-translate-component";
import {ChainStore} from "bitsharesjs";
import FormattedAsset from "../../Utility/FormattedAsset";

export const AssetFundFeePool = ({op, changeColor, linkToAccount}) => {
    changeColor("warning");

    let asset = ChainStore.getAsset(op[1].asset_id);
    if (asset) asset = asset.get("symbol");
    else asset = op[1].asset_id;
    return (
        <span>
            {linkToAccount(op[1].from_account)} &nbsp;
            <Translate
                component="span"
                content="proposal.fund_pool"
                asset={asset}
            />
            &nbsp;
            <FormattedAsset
                style={{fontWeight: "bold"}}
                amount={op[1].amount}
                asset="1.3.0"
            />
        </span>
    );
};
