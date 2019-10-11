import React from "react";
import Translate from "react-translate-component";
import BindToChainState from "../../Utility/BindToChainState";
import TranslateWithLinks from "../../Utility/TranslateWithLinks";
import account_constants from "chain/account_constants";

export const AccountWhitelist = ({op, fromComponent}) => {
    let listings = account_constants.account_listing;
    let label =
        op[1].new_listing === listings.no_listing
            ? "unlisted_by"
            : op[1].new_listing === listings.white_listed
                ? "whitelisted_by"
                : "blacklisted_by";
    if (fromComponent === "proposed_operation") {
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
    } else {
        return (
            <span>
                <TranslateWithLinks
                    string={"operation." + label}
                    keys={[
                        {
                            type: "account",
                            value: op[1].authorizing_account,
                            arg: "lister"
                        },
                        {
                            type: "account",
                            value: op[1].account_to_list,
                            arg: "listee"
                        }
                    ]}
                />
            </span>
        );
    }
};
