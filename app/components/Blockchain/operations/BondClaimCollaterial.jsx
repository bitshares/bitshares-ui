import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";

export const BondClaimCollaterial = ({op, linkToAccount, current}) => {
    if (current === op[1].lender) {
        return (
            <span>
                <Translate
                    component="span"
                    content="proposal.bond_pay_collateral"
                />
                &nbsp;
                <FormattedAsset
                    style={{fontWeight: "bold"}}
                    amount={op[1].collateral_claimed.amount}
                    asset={op[1].collateral_claimed.asset_id}
                />
                <Translate component="span" content="proposal.to" />
                &nbsp;
                {linkToAccount(op[1].claimer)}
            </span>
        );
    } else if (current === op[1].claimer) {
        return (
            <span>
                <Translate
                    component="span"
                    content="proposal.bond_claim_collateral"
                />
                &nbsp;
                <FormattedAsset
                    style={{fontWeight: "bold"}}
                    amount={op[1].collateral_claimed.amount}
                    asset={op[1].collateral_claimed.asset_id}
                />
                <Translate component="span" content="proposal.from" />
                &nbsp;
                {linkToAccount(op[1].lender)}
            </span>
        );
    } else {
        return null;
    }
};
