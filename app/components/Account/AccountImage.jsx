import React from "react";
import Identicon from "./Identicon";
import {PropTypes, Component} from "react";

class AccountImage extends Component {
    render() {
        let {account, image, style} = this.props;
        let {height, width} = this.props.size;
        let custom_image = image ?
            <img src={image} height={height + this.props.unit} width={width + this.props.unit}/> :
            <Identicon id={account} account={account} size={this.props.size} unit={this.props.unit} />;

        return (
            <div style={style} className="account-image">
                {custom_image}
            </div>
        );
    }
}

AccountImage.defaultProps = {
    src: "",
    account: "",
    size: {height: 120, width: 120},
    style: {},
    unit: "px",
};

AccountImage.propTypes = {
    src: PropTypes.string,
    account: PropTypes.string,
    size: PropTypes.object.isRequired,
    style: PropTypes.object,
    unit: PropTypes.string,
};

export default AccountImage;
