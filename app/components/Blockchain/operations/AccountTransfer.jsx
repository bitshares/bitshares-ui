import React from "react";
import Translate from "react-translate-component";

export const AccountTransfer = ({op, linkToAccount}) => {
    return (
        <span>
            <Translate component="span" content="proposal.transfer_account" />
            &nbsp;
            {linkToAccount(op[1].account_id)}
            <Translate component="span" content="proposal.to" />
            &nbsp;
            {linkToAccount(op[1].new_owner)}
        </span>
    );
};
