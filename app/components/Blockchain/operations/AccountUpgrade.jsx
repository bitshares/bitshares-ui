import React from "react";
import Translate from "react-translate-component";

export const AccountUpgrade = ({op, linkToAccount}) => {
    if (op[1].upgrade_to_lifetime_member) {
        return (
            <span>
                {linkToAccount(op[1].account_to_upgrade)} &nbsp;
                <Translate
                    component="span"
                    content="proposal.lifetime_upgrade_account"
                />
            </span>
        );
    } else {
        return (
            <span>
                {linkToAccount(op[1].account_to_upgrade)} &nbsp;
                <Translate
                    component="span"
                    content="proposal.annual_upgrade_account"
                />
            </span>
        );
    }
};
