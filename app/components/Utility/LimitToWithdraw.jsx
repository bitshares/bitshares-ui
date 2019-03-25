import React from "react";
import FormattedAsset from "./FormattedAsset";
import PropTypes from "prop-types";

class LimitToWithdraw extends React.Component {
    static propTypes = {
        hide_asset: PropTypes.bool
    };

    static defaultProps = {
        hide_asset: false
    };

    render() {
        return (
            <FormattedAsset
                amount={this.props.amount}
                asset={this.props.assetId}
                asPercentage={this.props.asPercentage}
                assetInfo={this.props.assetInfo}
                replace={this.props.replace}
                hide_asset={this.props.hide_asset}
            />
        );
    }
}

export default LimitToWithdraw;
