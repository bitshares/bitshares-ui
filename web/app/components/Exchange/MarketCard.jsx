import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import {ChainStore} from "graphenejs-lib";

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

    static contextTypes = {
        history: React.PropTypes.object
    }

    _onClick(marketID) {
        this.context.history.pushState(null, `/market/${marketID}`);
    }

    render() {

        let {quote, base} = this.props;
        if (!quote || !base) {
            return null;
        }
        let marketID = quote.get("symbol") + "_" + base.get("symbol");
        let marketName = quote.get("symbol") + " : " + base.get("symbol");
        let dynamic_data = quote.get("dynamic");
        let base_dynamic_data = base.get("dynamic");

        let price = utils.convertPrice(quote, base);

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
                                                quote_amount={price.quoteAmount}
                                                quote_asset={quote.get("id")}
                                                base_amount={price.baseAmount}
                                                base_asset={base.get("id")}
                                            />

                                    </li>
                                    <li><Translate content="markets.supply" />:&nbsp;
                                        {dynamic_data ? <FormattedAsset
                                            style={{fontWeight: "bold"}}
                                            amount={parseInt(dynamic_data.get("current_supply"), 10)}
                                            asset={quote.get("id")}/> : null}
                                    </li>
                                    <li><Translate content="markets.supply" />:&nbsp;
                                        {base_dynamic_data ? <FormattedAsset
                                            style={{fontWeight: "bold"}}
                                            amount={parseInt(base_dynamic_data.get("current_supply"), 10)}
                                            asset={base.get("id")}/> : null}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    <span style={{marginBottom: "6px", marginRight: "6px", zIndex:999,  }} onClick={this.props.removeMarket} className="text float-right remove">–</span>
                </div>
            </div>
        );
    }
}

export default MarketCard;
