import React from "react";
import {PropTypes, Component} from "react";
import MarketCard from "./MarketCard";
import {Link} from "react-router";

class Markets extends Component {

    shouldComponentUpdate(nextProps) {
        // return (
        //     !Immutable.is(nextProps.accounts, this.props.accounts) ||
        //     !Immutable.is(nextProps.balances, this.props.balances)
        // );
        return true;
    }

    render() {
        console.log("[Markets.jsx:24] ----- render ----->", this.props);
        let {assets, balances, markets} = this.props;

        markets = [{quoteSymbol: "SHILL", baseSymbol: "CORE"}];
        let itemRows = markets
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
                return (
                    <MarketCard
                        key={index}
                        assets={assets}
                        market={a}
                        />
                );
            });

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block medium-12">
                        <div className="grid-block small-up-3" style={{alignItems: "flex-start"}}>
                            {itemRows}
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
