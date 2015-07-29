import React from "react";
import AccountImage from "./AccountImage";
import {PropTypes, Component} from "react";
import Utils from "common/utils.js";

class AccountInfo extends Component {
    render() {
        let {account_name, account_id, image_size} = this.props;
        let display_id = Utils.get_object_id(account_id);
        return (
            <div className={"account-info" + (this.props.my_account ? " my-account" : "")}>
                {this.props.title ? <h4>{this.props.title}</h4> : null}
                <AccountImage size={image_size} account={account_name} custom_image={null}/>
                <h5>{account_name}</h5>
                <h6 className="subheader">#{display_id} {this.props.my_account ? <span className="my-account-label">(My Account)</span> : null}</h6>
            </div>
        );
    }
}

AccountInfo.defaultProps = {
    title: null,
    account_name: "",
    account_id: "",
    image_size: {height: 120, width: 120}
};

AccountInfo.propTypes = {
    title: PropTypes.string,
    account_name: PropTypes.string.isRequired,
    account_id: PropTypes.string.isRequired,
    image_size: PropTypes.object.isRequired,
    my_account: PropTypes.bool
};

export default AccountInfo;
