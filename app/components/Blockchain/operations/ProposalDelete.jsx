import React from "react";
import Translate from "react-translate-component";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

const ShortObjectId = ({objectId}) => {
    if (typeof objectId === "string") {
        const parts = objectId.split(".");
        const {length} = parts;
        if (length > 0) return "#" + parts[length - 1];
    }
    return objectId;
};

export const ProposalDelete = ({op, fromComponent}) => {
    if (fromComponent === "proposed_operation") {
        return (
            <span>
                <Translate
                    component="span"
                    content="proposal.proposal_update"
                />
            </span>
        );
    } else {
        return (
            <span>
                <TranslateWithLinks
                    string="operation.proposal_delete"
                    keys={[
                        {
                            type: "account",
                            value: op[1].fee_paying_account,
                            arg: "account"
                        },
                        {
                            value: <ShortObjectId objectId={op[1].proposal} />,
                            arg: "proposal"
                        }
                    ]}
                />
            </span>
        );
    }
};
