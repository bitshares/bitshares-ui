import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";

export const WorkerCreate = ({op}) => {
    return (
        <span>
            <Translate component="span" content="proposal.create_worker" />
            &nbsp;
            <FormattedAsset
                style={{fontWeight: "bold"}}
                amount={op[1].daily_pay}
                asset={"1.3.0"}
            />
        </span>
    );
};
