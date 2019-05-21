import React from "react";
import Translate from "react-translate-component";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AccountTransfer = ({op, linkToAccount, fromComponent}) => {
    if (fromComponent === "proposed_operation") {
        return (
            <span>
                <Translate
                    component="span"
                    content="proposal.transfer_account"
                />
                &nbsp;
                {linkToAccount(op[1].account_id)}
                <Translate component="span" content="proposal.to" />
                &nbsp;
                {linkToAccount(op[1].new_owner)}
            </span>
        );
    } else {
        return (
            <span>
                <TranslateWithLinks
                    string="operation.account_transfer"
                    keys={[
                        {
                            type: "account",
                            value: op[1].account_id,
                            arg: "account"
                        },
                        {
                            type: "account",
                            value: op[1].new_owner,
                            arg: "to"
                        }
                    ]}
                />
            </span>
        );
    }
};
