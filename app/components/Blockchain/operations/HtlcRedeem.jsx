import React from "react";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";
import {Tooltip} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

export const HtlcRedeem = ({op, changeColor}) => {
    changeColor("success");
    return (
        <React.Fragment>
            <span className="right-td">
                <TranslateWithLinks
                    string="operation.htlc_redeem"
                    keys={[
                        {
                            type: "account",
                            value: op[1].redeemer,
                            arg: "redeemer"
                        },
                        {
                            value: op[1].htlc_id,
                            arg: "htlc_id"
                        }
                    ]}
                />
            </span>
            <div className="memo" style={{paddingTop: 5, cursor: "help"}}>
                <Tooltip
                    placement="bottom"
                    title={counterpart.translate("htlc.preimage_explanation")}
                >
                    <span className="inline-block">
                        {counterpart.translate("htlc.preimage") +
                            ": " +
                            op[1].preimage}
                    </span>
                </Tooltip>
            </div>
        </React.Fragment>
    );
};
