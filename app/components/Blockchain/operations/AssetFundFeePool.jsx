import React from "react";
import Translate from "react-translate-component";
import {ChainStore} from "tuscjs";
import FormattedAsset from "../../Utility/FormattedAsset";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetFundFeePool = ({
    op,
    changeColor,
    linkToAccount,
    fromComponent
}) => {
    changeColor("warning");
    if (fromComponent === "proposed_operation") {
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
    } else {
        return (
            <span>
                <TranslateWithLinks
                    string="operation.asset_fund_fee_pool"
                    keys={[
                        {
                            type: "account",
                            value: op[1].from_account,
                            arg: "account"
                        },
                        {
                            type: "asset",
                            value: op[1].asset_id,
                            arg: "asset"
                        },
                        {
                            type: "amount",
                            value: {
                                amount: op[1].amount,
                                asset_id: "1.3.0"
                            },
                            arg: "amount"
                        }
                    ]}
                />
            </span>
        );
    }
};
