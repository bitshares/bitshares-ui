import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AccountUpdate = ({op}) => {
    return (
        <span>
            <TranslateWithLinks
                string="proposal.update_account"
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
