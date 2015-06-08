import React from "react";
import AccountImage from "./AccountImage";
import {PropTypes, Component} from "react";

class AccountInfo extends Component {
    render() {
        let {account_name, account_id, image_size} = this.props;
        return (
            <div>
                <AccountImage size={image_size} account={account_name} custom_image={null}/>
                <h5>{account_name}</h5>
                <h6 className="subheader">#{account_id}</h6>
            </div>
        );
    }
}

AccountInfo.propTypes = {
    account_name: PropTypes.string.isRequired,
    account_id: PropTypes.string.isRequired,
    image_size: PropTypes.object.isRequired
};

export default AccountInfo;
