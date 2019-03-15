import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";

export const WitnessWithdrawPay = ({op, current, linkToAccount}) => {
    if (current === op[1].witness_account) {
        return (
            <span>
                <Translate component="span" content="proposal.witness_pay" />
                &nbsp;
                <FormattedAsset
                    style={{fontWeight: "bold"}}
                    amount={op[1].amount}
                    asset={"1.3.0"}
                />
                <Translate component="span" content="proposal.to" />
                &nbsp;
                {linkToAccount(op[1].witness_account)}
            </span>
        );
    } else {
        return (
            <span>
                <Translate component="span" content="proposal.received" />
                &nbsp;
                <FormattedAsset
                    style={{fontWeight: "bold"}}
                    amount={op[1].amount}
                    asset={"1.3.0"}
                />
                <Translate component="span" content="proposal.from" />
                &nbsp;
                {linkToAccount(op[1].witness_account)}
            </span>
        );
    }
};
