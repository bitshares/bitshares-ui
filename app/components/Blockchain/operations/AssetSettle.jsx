import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const AssetSettle = ({op, result, changeColor, fromComponent}) => {
    changeColor("warning");
    if (fromComponent === "proposed_operation") {
        return (
            <span>
                <TranslateWithLinks
                    string="proposal.asset_settle"
                    keys={[
                        {
                            type: "account",
                            value: op[1].account,
                            arg: "account"
                        },
                        {
                            type: "amount",
                            value: op[1].amount,
                            arg: "amount"
                        }
                    ]}
                />
            </span>
        );
    } else {
        const baseAmount = op[1].amount;
        const instantSettleCode = 2;
        if (result && result[0] == instantSettleCode) {
            const quoteAmount = result[1];
            return (
                <span>
                    <TranslateWithLinks
                        string="operation.asset_settle_instant"
                        keys={[
                            {
                                type: "account",
                                value: op[1].account,
                                arg: "account"
                            },
                            {
                                type: "amount",
                                value: baseAmount,
                                arg: "amount"
                            },
                            {
                                type: "price",
                                value: {
                                    base: baseAmount,
                                    quote: quoteAmount
                                },
                                arg: "price"
                            }
                        ]}
                    />
                </span>
            );
        } else {
            return (
                <span>
                    <TranslateWithLinks
                        string="operation.asset_settle"
                        keys={[
                            {
                                type: "account",
                                value: op[1].account,
                                arg: "account"
                            },
                            {
                                type: "amount",
                                value: op[1].amount,
                                arg: "amount"
                            }
                        ]}
                    />
                </span>
            );
        }
    }
};
