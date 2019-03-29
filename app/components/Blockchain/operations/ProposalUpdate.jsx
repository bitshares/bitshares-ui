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

export const ProposalUpdate = ({op, linkToAccount, fromComponent}) => {
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
        const fields = [
            "active_approvals_to_add",
            "active_approvals_to_remove",
            "owner_approvals_to_add",
            "owner_approvals_to_remove",
            "key_approvals_to_add",
            "key_approvals_to_remove"
        ];
        return (
            <div>
                <span>
                    <TranslateWithLinks
                        string="operation.proposal_update"
                        keys={[
                            {
                                type: "account",
                                value: op[1].fee_paying_account,
                                arg: "account"
                            },
                            {
                                value: (
                                    <ShortObjectId objectId={op[1].proposal} />
                                ),
                                arg: "proposal"
                            }
                        ]}
                    />
                </span>
                <div className="proposal-update">
                    {fields.map(field => {
                        if (op[1][field].length) {
                            return (
                                <div key={field}>
                                    <Translate
                                        content={`proposal.updated.${field}`}
                                    />
                                    <ul>
                                        {op[1][field].map(value => {
                                            return (
                                                <li key={value}>
                                                    {field.startsWith("key")
                                                        ? value
                                                        : linkToAccount(value)}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        } else return null;
                    })}
                </div>
            </div>
        );
    }
};
