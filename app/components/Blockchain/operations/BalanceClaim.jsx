import React from "react";
import Translate from "react-translate-component";
import BindToChainState from "../../Utility/BindToChainState";
import utils from "common/utils";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const BalanceClaim = ({
    op,
    changeColor,
    linkToAccount,
    fromComponent
}) => {
    changeColor("success");
    op[1].total_claimed.amount = parseInt(op[1].total_claimed.amount, 10);

    if (fromComponent === "proposed_operation") {
        return (
            <span>
                {linkToAccount(op[1].deposit_to_account)}
                &nbsp;
                <BindToChainState.Wrapper asset={op[1].total_claimed.asset_id}>
                    {({asset}) => (
                        <Translate
                            component="span"
                            content="proposal.balance_claim"
                            balance_amount={utils.format_asset(
                                op[1].total_claimed.amount,
                                asset
                            )}
                            balance_id={op[1].balance_to_claim.substring(5)}
                        />
                    )}
                </BindToChainState.Wrapper>
            </span>
        );
    } else {
        return (
            <span>
                <TranslateWithLinks
                    string="operation.balance_claim"
                    keys={[
                        {
                            type: "account",
                            value: op[1].deposit_to_account,
                            arg: "account"
                        },
                        {
                            type: "amount",
                            value: op[1].total_claimed,
                            arg: "amount"
                        }
                    ]}
                />
            </span>
        );
    }
};
