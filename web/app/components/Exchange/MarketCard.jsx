import React from "react";
import {Link} from "react-router";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import ChainStore from "api/ChainStore";

@BindToChainState()
class MarketCard extends React.Component {
    
    static propTypes = {
        quote: ChainTypes.ChainAsset.isRequired,
        base: ChainTypes.ChainAsset.isRequired
    }

    render() {

        let {quote, base} = this.props;
        let marketID = quote.get("symbol") + "_" + base.get("symbol");
        let marketName = quote.get("symbol") + " vs " + base.get("symbol");
        let dynamic_data = ChainStore.getObject(quote.get("dynamic_asset_data_id"));
        
        return (
            <div style={{padding: "0.5em 0.5em"}} className="grid-content account-card">
                <div className="card">
                    <Link to="exchange" params={{marketID: marketID}}>
                        <div style={{padding: "5px"}}>
                        </div>
                        <div style={{color: "black"}} className="card-divider text-center">
                            <span>{marketName} { /* <span style={{zIndex:999}} onClick={this.props.removeMarket} className="badge float-right">-</span> */ }</span>
                        </div>
                        <div className="card-section">
                            <ul >
                                <li><Translate content="markets.core_rate" />: <FormattedPrice
                                                    style={{fontWeight: "bold"}}
                                                    quote_amount={quote.getIn(["options", "core_exchange_rate", "quote", "amount"])}
                                                    quote_asset={quote.get("id")}
                                                    base_amount={quote.get(["options", "core_exchange_rate", "base", "amount"])}
                                                    base_asset={base.get("id")} />
                                </li>
                                <li><Translate content="markets.supply" />: <FormattedAsset
                                                    style={{fontWeight: "bold"}}
                                                    amount={dynamic_data.get("current_supply")}
                                                    asset={quote.get("id")}
                                                    />
                                </li>
                            </ul>
                        </div>
                    </Link>
                </div>
            </div>
        );
    }
}

export default MarketCard;
