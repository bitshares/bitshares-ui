import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";


@BindToChainState({show_loader: true})
class MarketCard extends React.Component {

    static propTypes = {
        quote: ChainTypes.ChainAsset.isRequired,
        base: ChainTypes.ChainAsset.isRequired,
        core: ChainTypes.ChainAsset.isRequired
    }

    static defaultProps = {
        core: "1.3.0"
    }

    static contextTypes = {router: React.PropTypes.func.isRequired};

    _onClick(marketID) {
        this.context.router.transitionTo("exchange", {marketID: marketID});
    }

    render() {

        let {quote, base} = this.props;
        if (!quote || !base) {
            return null;
        }
        let marketID = quote.get("symbol") + "_" + base.get("symbol");
        let marketName = quote.get("symbol") + " : " + base.get("symbol");
        let dynamic_data = quote.get("dynamic");

        let rate, convert = {}, invert, decimals, basePrice, quotePrice;
        if (quote.get("id") !== "1.3.0" && base.get("id") !== "1.3.0") {
            rate = quote.getIn(["options", "core_exchange_rate"]);
            basePrice = utils.get_asset_price(
                base.getIn(["options", "core_exchange_rate", "quote", "amount"]),
                this.props.core,
                base.getIn(["options", "core_exchange_rate", "base", "amount"]),
                base
            );

            convert.quoteAmount = utils.get_asset_precision(base.get("precision")) * rate.getIn(["quote", "amount"]) / utils.get_asset_precision(this.props.core.get("precision")) / basePrice;
            convert.id = base.getIn(["options", "core_exchange_rate", "base", "asset_id"]);
            invert = true;
        } else if (quote.get("id") === "1.3.0") {
            rate = base.getIn(["options", "core_exchange_rate"]);
            invert = false;
            convert = false;
        } else {
            rate = quote.getIn(["options", "core_exchange_rate"]);
            invert = true;
            decimals = 2;
            convert = false;
        }

        return (
            <div style={{padding: "0.5em 0.5em"}} className="grid-content account-card">
                <div className="card">
                        <div onClick={this._onClick.bind(this, marketID)}>
                            <div style={{padding: "5px"}}>
                            </div>
                            <div className="card-divider text-center info">
                                <span>{marketName}</span>
                            </div>
                            <div className="card-section">
                                <ul >
                                    <li>
                                        <Translate content="markets.core_rate" />:&nbsp;
                                            <FormattedPrice
                                                style={{fontWeight: "bold"}}
                                                quote_amount={convert ? convert.quoteAmount : rate.getIn(["quote", "amount"])}
                                                quote_asset={convert ? convert.id : rate.getIn(["quote", "asset_id"])}
                                                base_amount={rate.getIn(["base", "amount"])}
                                                base_asset={rate.getIn(["base", "asset_id"])}
                                                invert={invert}
                                                decimals={decimals}
                                            />

                                    </li>
                                    <li><Translate content="markets.supply" />:&nbsp;
                                        {dynamic_data ? <FormattedAsset
                                            style={{fontWeight: "bold"}}
                                            amount={parseInt(dynamic_data.get("current_supply"), 10)}
                                            asset={quote.get("id")}/> : null}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    <span style={{marginBottom: "6px", marginRight: "6px", zIndex:999,  }} onClick={this.props.removeMarket} className="text alert float-right remove">–</span>
                </div>
            </div>
        );
    }
}

export default MarketCard;
