import React from "react";
import {PropTypes, Component} from "react";
import MarketCard from "./MarketCard";
import Immutable from "immutable";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";
import Translate from "react-translate-component";

class Markets extends Component {

    constructor() {
        super();
        this.state = {
            filterMarket: ""
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            !Immutable.is(nextProps.settings, this.props.settings) ||
            nextProps.baseAsset !== this.props.baseAsset ||
            nextState.filterMarket !== this.state.filterMarket
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
        let base = this.props.assets.get(e.target[e.target.selectedIndex].id);
        MarketsActions.changeBase({id: base.id, symbol: base.symbol, precision: base.precision});
    }

    _onFilterInput(e) {
        this.setState({filterMarket: e.target.value});
    }

    render() {
        console.log("[Markets.jsx:24] ----- render ----->", this.props);
        let {assets, settings, markets, baseAsset} = this.props;

        let marketCards = assets
            .filter(a => {
                return a.symbol.indexOf(this.state.filterMarket.toUpperCase()) !== -1;
            })
            .map((a, index) => {
                if (a.symbol !== baseAsset.symbol) {
                    let market;
                    if (settings.get("inverseMarket")) {
                        market = {quoteSymbol: a.symbol, baseSymbol: baseAsset.symbol};
                    } else {
                        market = {quoteSymbol: baseAsset.symbol, baseSymbol: a.symbol};
                    }
                    return (
                        <MarketCard
                            key={index}
                            market={market}
                            options={a.options}
                            data={a.dynamic_data}
                            assets={assets}
                            />
                    );
                }
            }).filter(a => {
                return a !== undefined;
            }).toArray();

        let baseOptions = assets.map(a => {
            return <option key={a.id} id={a.id}>{a.symbol}</option>;
        }).toArray();

        return (
            <div className="grid-block vertical" style={{flexWrap: "nowrap"}}>
                <div className="grid-block horizontal page-layout left-column-2 shrink" style={{minWidth: "15rem"}}>
                    <div className="grid-block small-5 small-offset-1" style={{padding: "0.5rem"}}>
                        <div className="grid-container">
                        <section className="block-list">
                            <header><Translate content="markets.choose_base" />:</header>
                                <ul>
                                    <li className="with-dropdown">
                                    <select style={{lineHeight: "1.2em"}} value={baseAsset.symbol} onChange={this._onChangeBase.bind(this)}>
                                        {baseOptions}
                                    </select>
                                    </li>
                                </ul>
                        </section>
                        </div>
                    </div>
                    <div className="grid-block vertical small-5">
                        <h5><Translate content="markets.filter" />:</h5>
                        <input type="text" value={this.state.filterMarket} onChange={this._onFilterInput.bind(this)}></input>
                    </div>
                </div>
                <div className="grid-block page-layout" style={{overflowY: "auto", zIndex: 1, alignItems: "flex-start"}}>
                    <div className="grid-block small-up-1 medium-up-2 large-up-3">
                        {marketCards}
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
