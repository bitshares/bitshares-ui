import React from "react";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";

/**
 *  Given an account id, displays the name of that account
 *
 *  Expects one property, 'account' which should be a account id
 */

class AccountName extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        autosubscribe: false
    };

    render() {
        if (!this.props.account) return null;
        return <span>{this.props.account.get("name")}</span>;
    }
}

export default BindToChainState(AccountName);
