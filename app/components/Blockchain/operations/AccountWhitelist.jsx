import React from "react";
import Translate from "react-translate-component";
import BindToChainState from "../../Utility/BindToChainState";

export const AccountWhitelist = ({op}) => {
    let label =
        op[1].new_listing === listings.no_listing
            ? "unlisted_by"
            : op[1].new_listing === listings.white_listed
                ? "whitelisted_by"
                : "blacklisted_by";

    return (
        <span>
            <BindToChainState.Wrapper
                lister={op[1].authorizing_account}
                listee={op[1].account_to_list}
            >
                {({lister, listee}) => (
                    <Translate
                        component="span"
                        content={"transaction." + label}
                        lister={lister.get("name")}
                        listee={listee.get("name")}
                    />
                )}
            </BindToChainState.Wrapper>
        </span>
    );
};
