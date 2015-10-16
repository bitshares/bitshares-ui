import React from "react";
import {FormattedNumber} from "react-intl";
import utils from "common/utils";
import {PropTypes} from "react";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";

/**
 *  Given an amount and an asset, render it with proper precision
 *
 *  Expected Properties:
 *     base_asset:  asset id, which will be fetched from the 
 *     base_amount: the ammount of asset
 *     quote_asset:  
 *     quote_amount: the ammount of asset
 *
 */

@BindToChainState()
class FormattedPrice extends React.Component {

    static propTypes = {
        base_asset: ChainTypes.ChainAsset.isRequired,
        quote_asset: ChainTypes.ChainAsset.isRequired,
        base_amount: React.PropTypes.number,
        quote_amount: React.PropTypes.number,
        invert: React.PropTypes.bool,
        decimals: React.PropTypes.number
    };  

    static defaultProps = {
      invert: false
    };

    constructor( props )
    {
       super(props)
       this.state = { flipped: props.invert }
    }

    onFlip() {
       this.setState( {flipped: !this.state.flipped} )
    }

    render() {

        let {base_asset, quote_asset, base_amount, quote_amount} = this.props;

        if( this.state.flipped ) {
           let tmp = base_asset;
           base_asset = quote_asset;
           quote_asset = tmp;
           let tmp_amount = base_amount;
           base_amount = quote_amount;
           quote_amount = tmp_amount;
        }

        let formatted_value = ''
        if (!this.props.hide_value) {
            let base_precision = utils.get_asset_precision(base_asset.get("precision"));
            let quote_precision = utils.get_asset_precision(quote_asset.get("precision"));
            let value = base_amount / base_precision / (quote_amount / quote_precision);

            let decimals = this.props.decimals ? this.props.decimals : base_asset.get("precision") + quote_asset.get("precision");

            formatted_value = (
                <FormattedNumber
                    value={value}
                    minimumFractionDigits={0}
                    maximumFractionDigits={decimals}
                />
            );
        }
        let symbols = this.props.hide_symbols ? '' :
                      (<a onClick={this.onFlip.bind(this)}> {base_asset.get("symbol") + "/" + quote_asset.get("symbol")}</a>);
        return (
            <span>
                {formatted_value}
                {symbols}
            </span>
         )
    }
}

export default FormattedPrice;

