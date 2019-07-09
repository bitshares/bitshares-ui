import React from "react";
import Translate from "react-translate-component";

export const BondCancelOffer = ({op}) => {
    return (
        <span>
            <Translate component="span" content="proposal.bond_cancel_offer" />
            &nbsp;
            {op[1].offer_id}
        </span>
    );
};
