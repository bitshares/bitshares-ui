import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";
import counterpart from "counterpart";
import {ChainTypes} from "bitsharesjs";

export const TicketCreate = ({op, linkToAccount, fromComponent}) => {
    const ticket_type = Object.keys(ChainTypes.ticket_type).find(
        key => ChainTypes.ticket_type[key] === op[1].target_type
    );
    return (
        <span>
            <TranslateWithLinks
                string="operation.ticket_create"
                keys={[
                    {
                        type: "account",
                        value: op[1].account,
                        arg: "from"
                    },
                    {
                        type: "amount",
                        value: op[1].amount,
                        arg: "amount"
                    }
                ]}
            />
            &nbsp; (
            {counterpart.translate("operation.ticket_types." + ticket_type)})
        </span>
    );
};
