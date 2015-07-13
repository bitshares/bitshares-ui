import React from "react";
import {Link} from "react-router";
import FormattedAsset from "../Utility/FormattedAsset";

class MarketCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {newAccount: "", error: false};
    }

    render() {

        let {market, options, data, assets} = this.props;
        let marketID = market.quoteSymbol + "_" + market.baseSymbol;
        let marketName = market.quoteSymbol + " vs " + market.baseSymbol;

        return (
            <div style={{padding: "0.5em 0.5em"}} className="grid-content account-card">
                <div className="card">
                    <Link to="exchange" params={{marketID: marketID}}>
                        <div style={{padding: "5px"}}>
                        </div>
                        <div style={{color: "black"}} className="card-divider">
                            {marketName}
                        </div>
                        <div style={{color: "black", paddingLeft: "0.5rem"}} className="card-section">
                            <ul style={{color: "white", listStyle: "none", fontSize: "85%", marginLeft: 0}}>
                                <li>Core rate: <FormattedAsset 
                                                    style={{fontWeight: "bold"}}
                                                    amount={options.core_exchange_rate.quote.amount}
                                                    asset={assets.get(options.core_exchange_rate.quote.asset_id)}
                                                    baseamount={options.core_exchange_rate.base.amount}
                                                    base={assets.get(options.core_exchange_rate.base.asset_id)} /> 
                                </li>
                                <li>Supply: <FormattedAsset 
                                                    style={{fontWeight: "bold"}}
                                                    amount={data.current_supply}
                                                    asset={assets.get(options.core_exchange_rate.quote.asset_id)}
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
