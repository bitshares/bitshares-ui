import React from "react";
import Translate from "react-translate-component";

export const ShortOrderCancel = ({op, changeColor}) => {
    changeColor("cancel");

    return (
        <span>
            <Translate component="span" content="proposal.short_order_cancel" />
            &nbsp;
            {op[1].order}
        </span>
    );
};
