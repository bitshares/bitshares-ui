import React from "react";
import AccountImage from "./AccountImage";
import Utils from "common/utils.js";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

@BindToChainState()
class AccountInfo extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        title: React.PropTypes.string,
        image_size: React.PropTypes.object.isRequired,
        my_account: React.PropTypes.bool
    }

    static defaultProps = {
        title: null,
        image_size: {height: 120, width: 120}
    }

    render() {
        let {account, image_size} = this.props;
        let display_id = Utils.get_object_id(account.get("id"));
        return (
            <div className={"account-info" + (this.props.my_account ? " my-account" : "")}>
                {this.props.title ? <h4>{this.props.title}</h4> : null}
                <AccountImage size={image_size} account={account.get("name")} custom_image={null}/>
                <h5>{account.get("name")}</h5>
                <h6 className="subheader">#{display_id} {this.props.my_account ? <span className="my-account-label">(My Account)</span> : null}</h6>
            </div>
        );
    }
}

export default AccountInfo;
