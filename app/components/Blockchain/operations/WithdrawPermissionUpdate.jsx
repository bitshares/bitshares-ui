import React from "react";
import Translate from "react-translate-component";

export const WithdrawPermissionUpdate = ({op, linkToAccount}) => {
    return (
        <span>
            <Translate
                component="span"
                content="proposal.withdraw_permission_update"
            />
            &nbsp;
            {linkToAccount(op[1].withdraw_from_account)}
            <Translate component="span" content="proposal.to" />
            &nbsp;
            {linkToAccount(op[1].authorized_account)}
        </span>
    );
};
