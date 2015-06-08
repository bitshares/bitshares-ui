import React from "react";
import {Link} from "react-router";

class MarketCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {newAccount: "", error: false};
    }

    render() {

        let {assets, market} = this.props;
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
                        <div style={{color: "black"}} className="card-section">
                            Some info
                        </div>
                    </Link>
                </div>
            </div>
        );
    }
}

export default MarketCard;
