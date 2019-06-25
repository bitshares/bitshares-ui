import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";

export const VestingBalanceCreate = ({op, linkToAccount, fromComponent}) => {
    if (fromComponent === "proposed_operation") {
        return (
            <span>
                &nbsp;
                {linkToAccount(op[1].creator)}
                <Translate
                    component="span"
                    content="proposal.vesting_balance_create"
                />
                &nbsp;
                <FormattedAsset
                    style={{fontWeight: "bold"}}
                    amount={op[1].amount.amount}
                    asset={op[1].amount.asset_id}
                />
                &nbsp;
                {linkToAccount(op[1].owner)}
            </span>
        );
    } else {
        return (
            <span>
                &nbsp;
                {linkToAccount(op[1].creator)}
                <Translate
                    component="span"
                    content="transaction.vesting_balance_create"
                />
                &nbsp;
                <FormattedAsset
                    amount={op[1].amount.amount}
                    asset={op[1].amount.asset_id}
                />
                &nbsp;
                {linkToAccount(op[1].owner)}
            </span>
        );
    }
};
