import React from "react";
import FormattedAsset from "./FormattedAsset";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import utils from "common/utils";

/**
 *  Given an asset amount, displays the equivalent value in baseAsset if possible
 *
 *  Expects three properties
 *  -'baseAsset' which should be a asset id
 *  -'quoteAsset' which is the asset id of the original asset amount
 *  -'amount' which is the amount itself
 *  -'fullPrecision' boolean to tell if the amount uses the full precision of the asset
 */

@BindToChainState({keep_updating: true})
class ValueComponent extends React.Component {

    static propTypes = {
        baseAsset: ChainTypes.ChainAsset.isRequired,
        quoteAsset: ChainTypes.ChainAsset.isRequired
    }

    static defaultProps = {
        baseAsset: "1.3.0",
        fullPrecision: true
    }

    render() {
        let {amount, baseAsset, quoteAsset, fullPrecision} = this.props;

        let coreType = this.props.baseAsset.get("id");
        let quoteType = this.props.quoteAsset.get("id");

        if (!fullPrecision) {
            amount = utils.get_asset_amount(amount, quoteAsset);
        }

        let quotePrecision = utils.get_asset_precision(quoteAsset.get("precision"));
        let basePrecision = utils.get_asset_precision(baseAsset.get("precision"));
        let price = utils.convertPrice(quoteAsset, baseAsset);
        let assetPrice = utils.get_asset_price(price.quoteAmount, quoteAsset, price.baseAmount, baseAsset);

        let eqValue = quoteType !== coreType ?
            basePrecision * (amount / quotePrecision) / assetPrice :
            amount;

        if (isNaN(eqValue) || !isFinite(eqValue)) {
            return <span>n/a</span>
        }
        if (coreType === quoteType) {
            return <FormattedAsset amount={eqValue} asset={coreType}/>;
        }

        return <FormattedAsset amount={eqValue} asset={coreType}/>;
    }
}


@BindToChainState({keep_updating: true})
class BalanceValueComponent extends React.Component {

    static propTypes = {
        balance: ChainTypes.ChainObject.isRequired
    }

    render() {
        let amount = Number(this.props.balance.get("balance"));
        let type = this.props.balance.get("asset_type");
            
        return <ValueComponent amount={amount} quoteAsset={type} baseAsset={this.props.baseAsset}/>;
    }
}

ValueComponent.BalanceValueComponent = BalanceValueComponent;
export default ValueComponent;
