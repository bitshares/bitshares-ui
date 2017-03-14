import React from "react";
import AccountImage from "./AccountImage";
import Utils from "common/utils.js";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Translate from "react-translate-component";

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

        let isLTM = account.get("lifetime_referrer_name") === account.get("name");

        return (
            <div className={"account-info" + (this.props.my_account ? " my-account" : "")}>
                {this.props.title ? <h4>{this.props.title}</h4> : null}
                <AccountImage size={image_size} account={account.get("name")} custom_image={null}/>
                <h4 className="account-title"><span className={isLTM ? "lifetime" : ""}>{account.get("name")}</span></h4>
                <div className="secondary">
                    <span className="subheader">#{display_id}</span>
                    {this.props.my_account ? <span className="my-account-label"><Translate content="account.mine" /></span> : null}
                </div>
            </div>
        );
    }
}

export default BindToChainState(AccountInfo);
