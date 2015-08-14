import React from "react";
import Identicon from "./Identicon";
import {PropTypes, Component} from "react";
import {Link} from "react-router";

class AccountImage extends Component {
    render() {
        let {account, image} = this.props;
        let {height, width} = this.props.size;
        let custom_image = image ?
            <img src={image} height={height + "px"} width={width + "px"}/> :
            <Identicon id={account} account={account} size={this.props.size}/>;
        let link_to_account = account ? account : "null-account"

        return (
            <div className="account-image">
              <Link to="account" params={{account_name: link_to_account}}>
                {custom_image}
              </Link>
            </div>
        );
    }
}

AccountImage.defaultProps = {
    src: "",
    account: "",
    size: {height: 120, width: 120}
};

AccountImage.propTypes = {
    src: PropTypes.string,
    account: PropTypes.string.isRequired,
    size: PropTypes.object.isRequired
};

export default AccountImage;
