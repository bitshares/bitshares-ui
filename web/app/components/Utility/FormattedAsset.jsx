import React from "react";
import {PropTypes, Component} from "react";

import {FormattedNumber} from "react-intl";
import utils from "common/utils";

class FormattedAsset extends Component {
    shouldComponentUpdate(nextProps) {
        let symbol = (this.props.asset && nextProps.asset) ? nextProps.asset.symbol !== this.props.asset.symbol : true;
        return (
            nextProps.amount !== this.props.amount || 
            symbol
            );
    }

    render() {
        let {amount, asset, base} = this.props;

        if (!asset) {
            return <span></span>;
        }

        let precision = utils.get_asset_precision(asset.precision);
        let decimals = Math.max(2, asset.precision - 2); 

        // The number of digits to display probably needs some more thought, and should probably be in a util function
        if (base) {
            return (
                    <span>
                        <FormattedNumber 
                            value={amount / precision}
                            minimumSignificantDigits={decimals}
                            maximumSignificantDigits={decimals}
                        /> {asset.symbol + "/" + base.symbol}
                    </span>
            );
        } else {
            return (
                    <span>
                        <FormattedNumber 
                            value={amount / precision}
                            minimumFractionDigits={decimals}
                            maximumFractionDigits={decimals}
                        /> {asset.symbol}
                    </span>
            );
        }
    }
}

FormattedAsset.defaultProps = {
    amount: 0,
    base: undefined,
    asset: undefined
};

FormattedAsset.propTypes = {
    amount: PropTypes.number.isRequired,
    base: PropTypes.object,
    asset: PropTypes.object.isRequired
};

export default FormattedAsset;

