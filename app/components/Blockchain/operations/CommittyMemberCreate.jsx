import React from "react";
import Translate from "react-translate-component";

export const CommittyMemberCreate = ({op, linkToAccount}) => {
    return (
        <span>
            <Translate
                component="span"
                content="proposal.committee_member_create"
            />
            &nbsp;
            {linkToAccount(op[1].committee_member_account)}
        </span>
    );
};
