import React from "react";
import Translate from "react-translate-component";

export const Custom = ({fromComponent}) => {
    return (
        <span>
            <Translate
                component="span"
                content={
                    fromComponent === "proposed_operation"
                        ? "proposal.custom"
                        : "transaction.custom"
                }
            />
        </span>
    );
};
