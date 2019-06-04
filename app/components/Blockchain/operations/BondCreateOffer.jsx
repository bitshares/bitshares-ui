import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";

export const BondCreateOffer = ({op}) => {
    return (
        <span>
            <Translate component="span" content="proposal.bond_create_offer" />
            &nbsp;
            <FormattedAsset
                style={{fontWeight: "bold"}}
                amount={op[1].amount.amount}
                asset={op[1].amount.asset_id}
            />
        </span>
    );
};
