import React from "react";
import Translate from "react-translate-component";

export const AccountCreate = ({op, current, linkToAccount}) => {
    if (current === op[1].registrar) {
        return (
            <span>
                <Translate component="span" content="proposal.reg_account" />
                &nbsp;
                {linkToAccount(op[1].name)}
            </span>
        );
    } else {
        return (
            <span>
                {linkToAccount(op[1].name)}
                &nbsp;
                <Translate
                    component="span"
                    content="proposal.was_reg_account"
                />
                &nbsp;
                {linkToAccount(op[1].registrar)}
            </span>
        );
    }
};
