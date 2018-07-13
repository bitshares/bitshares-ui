import React from "react";
import {Link} from "react-router-dom";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import PropTypes from "prop-types";

class LinkToAccountById extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccountName.isRequired,
        subpage: PropTypes.string.isRequired
    };

    static defaultProps = {
        subpage: "overview",
        autosubscribe: false
    };

    shouldComponentUpdate(nextProps) {
        if (nextProps.account === this.props.account) {
            return false;
        }
        return true;
    }

    render() {
        let account_name = this.props.account;
        if (!account_name) {
            return <span>{this.props.account.get("id")}</span>;
        }

        return this.props.noLink ? (
            <span>{account_name}</span>
        ) : (
            <Link
                onClick={this.props.onClick ? this.props.onClick : () => {}}
                to={`/account/${account_name}/${this.props.subpage}/`}
            >
                {account_name}
            </Link>
        );
    }
}

export default BindToChainState(LinkToAccountById, {autosubscribe: false});
