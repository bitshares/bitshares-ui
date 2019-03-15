import React from "react";
import Translate from "react-translate-component";

export const WithdrawPermissionClaim = ({op, linkToAccount}) => {
    return (
        <span>
            <Translate
                component="span"
                content="proposal.withdraw_permission_claim"
            />
            &nbsp;
            {linkToAccount(op[1].withdraw_from_account)}
            <Translate component="span" content="proposal.to" />
            &nbsp;
            {linkToAccount(op[1].withdraw_to_account)}
        </span>
    );
};
