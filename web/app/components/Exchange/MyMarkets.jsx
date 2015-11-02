import React from "react";
import {PropTypes} from "react/addons";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import connectToStores from "alt/utils/connectToStores";
import MarketRow from "./MarketRow";
import SettingsStore from "stores/SettingsStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import SettingsActions from "actions/SettingsActions";

@BindToChainState()
class MyMarkets extends React.Component {

    static propTypes = {
        assets: ChainTypes.ChainAssetsList.isRequired
    }

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    constructor(props) {
        super();
        this.state = {
            inverseSort: props.viewSettings.get("myMarketsInvert")
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            !Immutable.is(nextProps.markets, this.props.markets) ||
            nextState.inverseSort !== this.state.inverseSort
        );
    }

    componentDidMount() {
        let historyContainer = React.findDOMNode(this.refs.favorites);
        Ps.initialize(historyContainer);
    }

    componentDidUpdate() {
        let historyContainer = React.findDOMNode(this.refs.favorites);
        Ps.update(historyContainer);
    }

    _inverseSort() {
        SettingsActions.changeViewSetting({
            myMarketsInvert: !this.state.myMarketsInvert
        });
        this.setState({
            inverseSort: !this.state.inverseSort
        });
    }

    _goMarkets() {
        this.context.router.transitionTo("markets");
    }

    render() {
        let {markets} = this.props;
        let {inverseSort} = this.state;
        let marketRows = null;

        let columns = [
            {name: "marketName", index: 0},
            {name: "price", index: 1}
        ];

        let assets = {};
        this.props.assets.forEach(asset => {
            if (asset && asset.toJS()) {
                assets[asset.get("symbol")] = asset;
            }
        });

        if (markets.size > 0) {
            marketRows = this.props.markets.map(market => {
                if (assets[market.quote] && assets[market.base]) {
                    return (
                        <MarketRow
                            key={market.quote + "_" + market.base}
                            quote={market.quote}
                            base={market.base}
                            columns={columns}
                            leftAlign={true}
                            compact={true}
                        />
                    );
                }
            }).filter(a => {
                return a !== undefined;
            }).sort((a,b) => {
                let a_symbols = a.key.split("_");
                let b_symbols = b.key.split("_");
                if (a_symbols[0] > b_symbols[0]) {
                    return inverseSort ? -1 : 1;
                } else if (a_symbols[0] < b_symbols[0]) {
                    return inverseSort ? 1 : -1;
                } else {
                    if (a_symbols[1] > b_symbols[1]) {
                        return inverseSort ? -1 : 1;
                    } else if (a_symbols[1] < b_symbols[1]) {
                        return inverseSort ? 1 : -1
                    } else {
                        return 0;
                    }
                }

            }).toArray();

        } else {
            return null;
        }

        if (!marketRows.length || !marketRows) {
            return null;
        }

        return (
            <div className="left-order-book no-padding no-overflow">
                <div className="grid-block shrink left-orderbook-header bottom-header">
                    <table className="table expand order-table text-right market-right-padding">
                        <thead>
                            <tr>
                                <th className="mymarkets-header clickable" onClick={this._inverseSort.bind(this)} style={{textAlign: "left", paddingLeft: "15px"}}><Translate content="exchange.market_name" /></th>
                                <th className="mymarkets-header" style={{textAlign: "left" }}><button onClick={this._goMarkets.bind(this)} className="button outline"><Translate content="exchange.more" /></button></th>
                            </tr>
                        </thead>
                    </table>
                </div>
                <div className="table-container grid-content" ref="favorites">
                    <table className="table expand order-table text-right market-right-padding">
                        <tbody>
                        {
                            marketRows
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

@connectToStores
class MyMarketsWrapper extends React.Component {
    static getStores() {
        return [SettingsStore]
    }

    static getPropsFromStores() {
        return {
            markets: SettingsStore.getState().defaultMarkets,
            viewSettings: SettingsStore.getState().viewSettings
        }
    }

    render () {
        let {markets, viewSettings} = this.props;
        let assets = [];

        markets.forEach(market => {
            if (assets.indexOf(market.quote) === -1) {
                assets.push(market.quote);
            }
            if (assets.indexOf(market.base) === -1) {
                assets.push(market.base);
            }
        });

        return (
            <MyMarkets
                markets={markets}
                assets={Immutable.List(assets)}
                viewSettings={viewSettings}
            />
        );
    }
}

export default MyMarketsWrapper;
