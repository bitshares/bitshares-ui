import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AccountUpdate = ({op, fromComponent}) => {
    return (
        <span>
            <TranslateWithLinks
                string={
                    fromComponent === "proposed_operation"
                        ? "proposal.update_account"
                        : "operation.update_account"
                }
                keys={[
                    {
                        type: "account",
                        value: op[1].account,
                        arg: "account"
                    }
                ]}
            />
        </span>
    );
};
