import React from "react";
import {Link} from "react-router";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

@BindToChainState()
class LinkToAccountById extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainObject.isRequired
    }
    render() {
        let account_name = this.props.account.get("name");
        if (!account_name) {
            console.log( "account: ", account_name.toJS() );
            return <span>NULL</span>;
            return null;
        }
        return <Link to="account-overview" params={{account_name}}>{account_name}</Link>
    }
}

export default LinkToAccountById;
