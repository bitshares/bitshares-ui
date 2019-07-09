import React from "react";
import Translate from "react-translate-component";

export const CommittyMemberCreate = ({op, linkToAccount, fromComponent}) => {
    return (
        <span>
            <Translate
                component="span"
                content={
                    fromComponent === "proposed_operation"
                        ? "proposal.committee_member_create"
                        : "transaction.committee_member_create"
                }
            />
            &nbsp;
            {linkToAccount(op[1].committee_member_account)}
        </span>
    );
};
