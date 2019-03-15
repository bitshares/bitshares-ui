import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";
import MemoText from "../MemoText";

const TransferOperation = ({op, proposer, index, changeColor}) => {
    changeColor("success");
    let memoComponent = null;

    if (op[1].memo) {
        memoComponent = <MemoText memo={op[1].memo} />;
    }
    op[1].amount.amount = parseFloat(op[1].amount.amount);

    return (
        <span className="right-td">
            <div className="inline-block">
                {!!proposer && index == 0 ? (
                    <div style={{paddingBottom: "0.5rem"}}>
                        <TranslateWithLinks
                            string="operation.proposal_create"
                            keys={[
                                {
                                    type: "account",
                                    value: proposer,
                                    arg: "account"
                                }
                            ]}
                        />
                        :
                    </div>
                ) : null}
                <div>
                    <TranslateWithLinks
                        string="proposal.transfer"
                        keys={[
                            {
                                type: "account",
                                value: op[1].from,
                                arg: "from"
                            },
                            {
                                type: "amount",
                                value: op[1].amount,
                                arg: "amount"
                            },
                            {
                                type: "account",
                                value: op[1].to,
                                arg: "to"
                            }
                        ]}
                    />
                    {memoComponent}
                </div>
            </div>
        </span>
    );
};

export default TransferOperation;
