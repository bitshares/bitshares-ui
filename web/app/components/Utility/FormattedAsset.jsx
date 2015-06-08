import React from "react";
import {PropTypes, Component} from "react";

import {FormattedNumber} from "react-intl";
import utils from "common/utils";

class FormattedAsset extends Component {
    shouldComponentUpdate(nextProps) {
        return (nextProps.amount !== this.props.amount || 
            nextProps.asset.symbol !== this.props.asset.symbol
            );
    }

    render() {
        let {amount, asset, base} = this.props;
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

FormattedAsset.propTypes = {
    amount: PropTypes.number,
    base: PropTypes.object,
    asset: PropTypes.object.isRequired
};

export default FormattedAsset;

