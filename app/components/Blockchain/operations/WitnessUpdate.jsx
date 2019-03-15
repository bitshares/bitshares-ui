import React from "react";
import Translate from "react-translate-component";

export const WitnessUpdate = ({op, linkToAccount}) => {
    return (
        <span>
            <Translate component="span" content="proposal.witness_update" />
            &nbsp;
            {linkToAccount(op[1].witness_account)}
        </span>
    );
};
