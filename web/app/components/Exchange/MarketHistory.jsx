import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import market_utils from "common/market_utils";
import PriceText from "../Utility/PriceText";
import cnames from "classnames";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import connectToStores from "alt/utils/connectToStores";
import {operations} from "chain/chain_types";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";

@connectToStores
class MarketHistory extends React.Component {

    static getStores() {
        return [SettingsStore]
    }

    static getPropsFromStores() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        }
    }

    constructor(props) {
        super();
        this.state = {
            activeTab: props.viewSettings.get("historyTab", "history")
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.history, this.props.history) ||
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol ||
            nextProps.className !== this.props.className ||
            nextState.activeTab !== this.state.activeTab
        );
    }

    componentDidMount() {
        let historyContainer = ReactDOM.findDOMNode(this.refs.history);
        Ps.initialize(historyContainer);
    }

    componentDidUpdate() {
        let historyContainer = ReactDOM.findDOMNode(this.refs.history);
        Ps.update(historyContainer);
    }

    _changeTab(tab) {
        SettingsActions.changeViewSetting({
            historyTab: tab
        });
        this.setState({
            activeTab: tab
        });
    }

    render() {
        let {history, myHistory, base, quote, baseSymbol, quoteSymbol, flipped, isNullAccount} = this.props;
        let  {activeTab} = this.state;
        let historyRows = null;

        if (isNullAccount) {
            activeTab = "history";
        }

        if (activeTab === "my_history" && (myHistory && myHistory.size)) {
            let index = 0;
            let keyIndex = -1;
            let flipped = base.get("id").split(".")[2] > quote.get("id").split(".")[2];
            historyRows = myHistory.filter(a => {            
                let opType = a.getIn(["op", 0]);
                return (opType === operations.fill_order);
            }).filter(a => {
                let quoteID = quote.get("id");
                let baseID = base.get("id");
                let pays = a.getIn(["op", 1, "pays", "asset_id"]);
                let receives = a.getIn(["op", 1, "receives", "asset_id"]);
                let hasQuote = quoteID === pays || quoteID === receives;
                let hasBase = baseID === pays || baseID === receives;
                return hasQuote && hasBase;
            })
            .sort((a, b) => {
                return a.get("block_num") - a.get("block_num");
            })
            .map(trx => {
                let order  = trx.toJS().op[1];
                keyIndex++;
                let paysAsset, receivesAsset, isAsk = false;
                if (order.pays.asset_id === base.get("id")) {
                    paysAsset = base;
                    receivesAsset = quote;
                    isAsk = true;

                } else {
                    paysAsset = quote;
                    receivesAsset = base;
                }

                let parsed_order = market_utils.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped);
                const block_num = trx.get("block_num");
                return (
                    <tr key={"my_history_" + keyIndex}>
                        <td className={parsed_order.className}>
                            <PriceText preFormattedPrice={parsed_order} />
                        </td>
                        <td>{parsed_order.receives}</td>
                        <td>{parsed_order.pays}</td>
                        <td><Link to={`/block/${block_num}`}>#{utils.format_number(block_num, 0)}</Link></td>
                    </tr>
                );
            }).toArray();
        } else if (history && history.size) {
            let index = 0;
            let keyIndex = -1;
            let flipped = base.get("id").split(".")[2] > quote.get("id").split(".")[2];
            historyRows = this.props.history
            .filter(a => {
                index++;
                return index % 2 === 0;
            })
            .take(100)
            .map(order => {
                keyIndex++;
                let paysAsset, receivesAsset, isAsk = false;
                if (order.pays.asset_id === base.get("id")) {
                    paysAsset = base;
                    receivesAsset = quote;
                    isAsk = true;

                } else {
                    paysAsset = quote;
                    receivesAsset = base;
                }

                let parsed_order = market_utils.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped);
                return (
                    <tr key={"history_" + keyIndex}>
                        <td className={parsed_order.className}>
                            <PriceText preFormattedPrice={parsed_order} />
                        </td>
                        <td>{parsed_order.receives}</td>
                        <td>{parsed_order.pays}</td>
                        <td data-tip={new Date(order.time)}>{parsed_order.time}</td>
                    </tr>
                );
            }).toArray();
        }

        let hc = "mymarkets-header clickable";
        let historyClass = cnames(hc, {inactive: activeTab === "my_history"});
        let myHistoryClass = cnames(hc, {inactive: activeTab === "history"});

        return (
            <div className={this.props.className}>
                <div className="exchange-bordered">
                    <div style={this.props.headerStyle} className="grid-block shrink left-orderbook-header bottom-header">
                            <div className={cnames(myHistoryClass, {disabled: isNullAccount})} onClick={this._changeTab.bind(this, "my_history")} >
                                <Translate content="exchange.my_history" />
                            </div>
                        <div className={historyClass} onClick={this._changeTab.bind(this, "history")}>
                            <Translate content="exchange.history" />
                        </div>
                    </div>
                    <div className="grid-block shrink left-orderbook-header market-right-padding-only">
                        <table className="table order-table text-right market-right-padding">
                            <thead>
                                <tr>
                                    <th style={{width: "25%", textAlign: "center"}}><Translate className="header-sub-title" content="exchange.price" /></th>
                                    <th style={{width: "25%", textAlign: "center"}}><span className="header-sub-title"><AssetName name={quoteSymbol} /></span></th>
                                    <th style={{width: "25%", textAlign: "center"}}><span className="header-sub-title"><AssetName name={baseSymbol} /></span></th>
                                    <th style={{width: "25%", textAlign: "center"}}><Translate className="header-sub-title" content={activeTab === "history" ? "explorer.block.date" : "explorer.block.title"} /></th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div
                        className="table-container grid-block market-right-padding-only no-overflow"
                        ref="history"
                        style={{maxHeight: 210, overflow: "hidden"}}
                    >
                        <table className="table order-table text-right market-right-padding">
                            <TransitionWrapper
                                component="tbody"
                                transitionName="newrow"
                            >
                                {historyRows}
                            </TransitionWrapper>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

MarketHistory.defaultProps = {
    history: []
};

MarketHistory.propTypes = {
    history: PropTypes.object.isRequired
};

export default MarketHistory;
