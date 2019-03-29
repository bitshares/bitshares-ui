import React from "react";
import Translate from "react-translate-component";

export const GlobalParametersUpdate = ({fromComponent}) => {
    return (
        <span>
            <Translate
                component="span"
                content={
                    fromComponent === "proposed_operation"
                        ? "proposal.global_parameters_update"
                        : "transaction.global_parameters_update"
                }
            />
        </span>
    );
};
