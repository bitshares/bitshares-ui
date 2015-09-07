import React from "react";
import {FormattedNumber} from "react-intl";
import utils from "common/utils";
import {PropTypes} from "react";
import {Link} from "react-router";
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
    };  

    constructor( props )
    {
       super(props)
       this.state = { flipped: false }
    }

    onFlip() {
       this.setState( {flipped:!this.state.flipped} )
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

        let base_precision = utils.get_asset_precision(base_asset.get("precision"));
        let quote_precision = utils.get_asset_precision(quote_asset.get("precision"));
        let value = base_amount / base_precision / (quote_amount / quote_precision);
        // console.log(value);
        return (
                <span>
                   <FormattedNumber value={value} minimumFractionDigits={0} maximumFractionDigits={base_asset.get("precision")} />
                   <span onClick={this.onFlip.bind(this)}> {base_asset.get("symbol") + " / " + quote_asset.get("symbol")}</span>
               </span>
         )
    }
}

export default FormattedPrice;

