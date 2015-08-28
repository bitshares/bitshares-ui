import React from "react";
import {Link} from "react-router";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

@BindToChainState()
class LinkToAccountById extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainObject
    }
    render() {
        if(!this.props.account) return <span>{this.props.account_id}</span>;
        let account_name = this.props.account.get("name");
        return <Link to="account" params={{account_name}}>{account_name}</Link>
    }
}

export default LinkToAccountById;
