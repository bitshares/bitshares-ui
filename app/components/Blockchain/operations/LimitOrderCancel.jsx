import React from "react";
import Translate from "react-translate-component";

export const LimitOrderCancel = ({op, changeColor}) => {
    changeColor("cancel");

    return (
        <span>
            {this.linkToAccount(op[1].fee_paying_account)}
            &nbsp;
            <Translate component="span" content="proposal.limit_order_cancel" />
            &nbsp;#
            {op[1].order.substring(4)}
        </span>
    );
};
