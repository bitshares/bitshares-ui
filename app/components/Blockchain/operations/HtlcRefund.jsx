import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";

export const HtlcRefund = ({op, changeColor}) => {
    changeColor("warning");
    return (
        <span className="right-td">
            <TranslateWithLinks
                string="operation.htlc_refund"
                keys={[
                    {
                        value: op[1].htlc_id,
                        arg: "htlc_id"
                    },
                    {
                        type: "account",
                        value: op[1].to,
                        arg: "to"
                    }
                ]}
            />
        </span>
    );
};
