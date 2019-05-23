import React from "react";
import Translate from "react-translate-component";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const WitnessCreate = ({op, linkToAccount, fromComponent}) => {
    if (fromComponent === "proposed_operation") {
        return (
            <span>
                <Translate component="span" content="proposal.witness_create" />
                &nbsp;
                {linkToAccount(op[1].witness_account)}
            </span>
        );
    } else {
        return (
            <span>
                <TranslateWithLinks
                    string="operation.witness_create"
                    keys={[
                        {
                            type: "account",
                            value: op[1].witness_account,
                            arg: "account"
                        }
                    ]}
                />
            </span>
        );
    }
};
