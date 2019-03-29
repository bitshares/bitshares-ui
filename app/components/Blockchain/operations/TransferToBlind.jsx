import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";

export const TransferToBlind = ({op, linkToAccount, fromComponent}) => {
    return (
        <span>
            {linkToAccount(op[1].from)}
            &nbsp;
            <Translate
                component="span"
                content={
                    fromComponent === "proposed_operation"
                        ? "proposal.sent"
                        : "transaction.sent"
                }
            />
            &nbsp;
            <FormattedAsset
                style={{fontWeight: "bold"}}
                amount={op[1].amount.amount}
                asset={op[1].amount.asset_id}
            />
        </span>
    );
};
