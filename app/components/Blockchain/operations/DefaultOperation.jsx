import React from "react";
import counterpart from "counterpart";

export const DefaultOperation = ({op}) => {
    console.log("unimplemented op:", op);
    return (
        <span>
            {counterpart.translate("operation.unknown_operation")} {op[0]}
        </span>
    );
};
