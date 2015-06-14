import React from "react";
import {PropTypes, Component} from "react";
import MarketCard from "./MarketCard";
import Immutable from "immutable";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";

class Markets extends Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            !Immutable.is(nextProps.settings, this.props.settings) ||
            nextProps.baseMarket !== this.props.baseMarket
        );
    }

    _switchMarkets() {
        console.log("switch markets");

        SettingsActions.changeSetting({
            setting: "inverseMarket",
            value: !this.props.settings.get("inverseMarket")
        });

    }

    _onChangeBase(e) {
        MarketsActions.changeBase(e.target.value);
    }

    render() {
        console.log("[Markets.jsx:24] ----- render ----->", this.props);
        let {assets, settings, markets, baseMarket} = this.props;

        let marketCards = assets
            .map((a, index) => {
                if (a.symbol !== baseMarket) {
                    let market;
                    if (settings.get("inverseMarket")) {
                        market = {quoteSymbol: a.symbol, baseSymbol: baseMarket};
                    } else {
                        market = {quoteSymbol: baseMarket, baseSymbol: a.symbol};
                    }
                    return (
                        <MarketCard
                            key={index}
                            market={market}
                            />
                    );
                }
            }).filter(a => {
                return a !== undefined;
            }).toArray();

        let baseOptions = assets.map(a => {
            return <option key={a.id}>{a.symbol}</option>;
        });

        return (
            <div className="grid-block small-horizontal">
                <div className="grid-block page-layout">
                    <div className="grid-container">
                        <section className="block-list">
                            <header>Switch market orientation</header>
                            <ul>
                            <li>
                            <span style={{visibility: "hidden"}}>A</span>
                            <div className="switch">
                            <input type="checkbox" checked={settings.get("inverseMarket")}/>
                            <label onClick={this._switchMarkets.bind(this)}></label>
                            </div>
                            </li>
                            </ul>
                        </section>
                        <section className="block-list">
                            <header>Select base asset:</header>
                                <ul>
                                    <li className="with-dropdown">
                                    <select style={{lineHeight: "1.2em"}} value={baseMarket} onChange={this._onChangeBase.bind(this)}>
                                        {baseOptions}
                                    </select>
                                    </li>
                                </ul>
                        </section>
                    </div>
                </div>
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
    settings: {},
    assets: {},
    markets: {}
};

Markets.propTypes = {
    settings: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    markets: PropTypes.object
};

export default Markets;
