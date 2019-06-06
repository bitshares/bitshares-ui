import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const VestingBalanceWithdraw = ({op, fromComponent}) => {
    return (
        <TranslateWithLinks
            string={
                fromComponent === "proposed_operation"
                    ? "proposal.vesting_balance_withdraw"
                    : "operation.vesting_balance_withdraw"
            }
            keys={[
                {
                    type: "account",
                    value: op[1].owner,
                    arg: "account"
                },
                {type: "amount", value: op[1].amount, arg: "amount"}
            ]}
        />
    );
};
