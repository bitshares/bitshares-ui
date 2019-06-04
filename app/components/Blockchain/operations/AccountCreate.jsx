import React from "react";
import Translate from "react-translate-component";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AccountCreate = ({op, current, linkToAccount, fromComponent}) => {
    if (fromComponent === "proposed_operation") {
        if (current === op[1].registrar) {
            return (
                <span>
                    <Translate
                        component="span"
                        content="proposal.reg_account"
                    />
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
    } else {
        return (
            <TranslateWithLinks
                string="operation.reg_account"
                keys={[
                    {
                        type: "account",
                        value: op[1].registrar,
                        arg: "registrar"
                    },
                    {
                        type: "account",
                        value: op[1].name,
                        arg: "new_account"
                    }
                ]}
            />
        );
    }
};
