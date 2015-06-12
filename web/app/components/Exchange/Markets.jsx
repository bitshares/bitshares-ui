import React from "react";
import {PropTypes, Component} from "react";
import MarketCard from "./MarketCard";
import Immutable from "immutable";

class Markets extends Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets)
        );
    }

    render() {
        console.log("[Markets.jsx:24] ----- render ----->", this.props);
        let {assets, balances, markets} = this.props;
        markets = [{quoteSymbol: "SHILL", baseSymbol: "CORE"}];
        let baseMarket = assets.get("1.4.0").symbol;
        let marketCards = assets
            // .sort((a, b) => { // By BTS balance first then by name
            //     // if (b.balances[0].amount - a.balances[0].amount === 0) {
            //     if (b.name > a.name) {
            //         return -1;
            //     } else if (b.name < a.name) {
            //         return 1;
            //     }
            //     return 0;
            //     // }
            //     // return b.balances[0].amount - a.balances[0].amount;
            // })
            .map((a, index) => {
                if (a.symbol !== baseMarket) {
                    return (
                        <MarketCard
                            key={index}
                            market={{quoteSymbol: a.symbol, baseSymbol: baseMarket}}
                            />
                    );
                }
            }).filter(a => {
                return a !== undefined;
            }).toArray();

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block medium-12" style={{alignItems: "flex-start"}}>
                        <div className="grid-block small-up-3">
                            {marketCards}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


Markets.defaultProps = {
    accounts: {},
    assets: {}
};

Markets.propTypes = {
    accounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired
};

export default Markets;
