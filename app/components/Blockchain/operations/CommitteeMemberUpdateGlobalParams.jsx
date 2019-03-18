import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const CommitteeMemberUpdateGlobalParams = () => {
    return (
        <span>
            <TranslateWithLinks
                string="proposal.committee_member_update_global_parameters"
                keys={[
                    {
                        type: "account",
                        value: "1.2.0",
                        arg: "account"
                    }
                ]}
            />
        </span>
    );
};
