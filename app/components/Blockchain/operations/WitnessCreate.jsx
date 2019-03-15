import React from "react";
import Translate from "react-translate-component";

export const WitnessCreate = ({op, linkToAccount}) => {
    return (
        <span>
            <Translate component="span" content="proposal.witness_create" />
            &nbsp;
            {linkToAccount(op[1].witness_account)}
        </span>
    );
};
