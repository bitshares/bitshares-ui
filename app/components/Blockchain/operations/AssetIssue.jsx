import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";
import MemoText from "../MemoText";

export const AssetIssue = ({op, changeColor, fromComponent}) => {
    changeColor("warning");
    let memoComponent;
    if (op[1].memo) {
        memoComponent = <MemoText memo={op[1].memo} />;
    }
    op[1].asset_to_issue.amount = parseInt(op[1].asset_to_issue.amount, 10);

    return (
        <span>
            <TranslateWithLinks
                string={
                    fromComponent === "proposed_operation"
                        ? "proposal.asset_issue"
                        : "operation.asset_issue"
                }
                keys={[
                    {
                        type: "account",
                        value: op[1].issuer,
                        arg: "account"
                    },
                    {
                        type: "amount",
                        value: op[1].asset_to_issue,
                        arg: "amount"
                    },
                    {
                        type: "account",
                        value: op[1].issue_to_account,
                        arg: "to"
                    }
                ]}
            />
            {memoComponent}
        </span>
    );
};
