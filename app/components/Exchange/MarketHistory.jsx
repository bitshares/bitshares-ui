import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import {connect} from "alt-react";
import {ChainTypes as grapheneChainTypes} from "bitsharesjs";
const {operations} = grapheneChainTypes;
import ReactTooltip from "react-tooltip";
import {FillOrder} from "common/MarketClasses";
import {
    MarketHistoryView,
    MarketHistoryViewMyHistoryRow,
    MarketHistoryViewMarketHistoryRow
} from "./View/MarketHistoryView";

class MarketHistory extends React.Component {
    constructor(props) {
        super();
        this.state = {
            activeTab: props.viewSettings.get("historyTab", "history"),
            rowCount: 20,
            showAll: false
        };
    }

    /***
     * Update PS Container
     * type:int [0:destroy, 1:init, 2:update] (default: 2)
     */
    _updateContainer(type = 2) {
        let containerNode = this.refs.view.refs.history;

        if (!containerNode) return;

        if (type == 0) {
            Ps.destroy(containerNode);
        } else if (type == 1) {
            Ps.initialize(containerNode);
            this._updateContainer(2);
        } else if (type == 2) {
            containerNode.scrollTop = 0;
            Ps.update(containerNode);
        }
        this.refs.view.refs.historyTransition.resetAnimation();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.history, this.props.history) ||
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol ||
            nextProps.className !== this.props.className ||
            nextProps.activeTab !== this.props.activeTab ||
            nextState.activeTab !== this.state.activeTab ||
            nextState.showAll !== this.state.showAll ||
            nextProps.currentAccount !== this.props.currentAccount ||
            nextProps.isPanelActive !== this.props.isPanelActive ||
            nextProps.hideScrollbars !== this.props.hideScrollbars
        );
    }

    componentDidMount() {
        if (!this.props.hideScrollbars) {
            this._updateContainer(1);
        }
    }

    componentDidUpdate(prevState) {
        if (prevState.showAll != this.state.showAll) {
            if (this.state.hideScrollbars && prevState.showAll) {
                this._updateContainer(0);
            } else if (this.state.hideScrollbars && !prevState.showAll) {
                this._updateContainer(1);
            } else {
                this._updateContainer(2);
            }
        }

        if (
            !this.props.hideScrollbars ||
            (this.props.hideScrollbars && this.state.showAll)
        ) {
            this._updateContainer(2);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.activeTab !== this.props.activeTab) {
            this._changeTab(nextProps.activeTab);
        }

        if (
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol
        ) {
            this._updateContainer(0);
        }

        if (nextProps.hideScrollbars !== this.props.hideScrollbars) {
            this._updateContainer(0);

            if (!nextProps.hideScrollbars) {
                this._updateContainer(1);
                this._updateContainer(2);
            }
        }
    }

    _changeTab(tab) {
        SettingsActions.changeViewSetting({
            historyTab: tab
        });
        this.setState({
            activeTab: tab
        });

        // Ensure that focus goes back to top of scrollable container when tab is changed
        this._updateContainer(2);
        setTimeout(ReactTooltip.rebuild, 1000);
    }

    _onSetShowAll() {
        this.setState({
            showAll: !this.state.showAll
        });

        if (this.state.showAll) {
            this.refs.view.refs.history.scrollTop = 0;
        }
    }

    render() {
        let {
            history,
            myHistory,
            base,
            quote,
            baseSymbol,
            quoteSymbol,
            isNullAccount,
            activeTab
        } = this.props;
        let {rowCount, showAll} = this.state;
        let historyRows = null;

        if (isNullAccount) {
            activeTab = "history";
        }

        const assets = {
            [quote.get("id")]: {
                precision: quote.get("precision")
            },
            [base.get("id")]: {
                precision: base.get("precision")
            }
        };

        if (activeTab === "my_history" && (myHistory && myHistory.size)) {
            historyRows = myHistory
                .filter(a => {
                    let opType = a.getIn(["op", 0]);
                    return opType === operations.fill_order;
                })
                .filter(a => {
                    let quoteID = quote.get("id");
                    let baseID = base.get("id");
                    let pays = a.getIn(["op", 1, "pays", "asset_id"]);
                    let receives = a.getIn(["op", 1, "receives", "asset_id"]);
                    let hasQuote = quoteID === pays || quoteID === receives;
                    let hasBase = baseID === pays || baseID === receives;
                    return hasQuote && hasBase;
                })
                .sort((a, b) => {
                    return b.get("block_num") - a.get("block_num");
                })
                .map(trx => {
                    let fill = new FillOrder(
                        trx.toJS(),
                        assets,
                        quote.get("id")
                    );

                    return (
                        <MarketHistoryViewMyHistoryRow
                            fill={fill}
                            base={base}
                            quote={quote}
                        />
                    );
                })
                .toArray();
        } else if (history && history.size) {
            historyRows = this.props.history
                .take(100)
                .map(fill => {
                    return (
                        <MarketHistoryViewMarketHistoryRow
                            fill={fill}
                            base={base}
                            quote={quote}
                        />
                    );
                })
                .toArray();
        }

        let totalRows = historyRows ? historyRows.length : null;
        if (!showAll && historyRows) {
            historyRows.splice(rowCount, historyRows.length);
        }

        return (
            <MarketHistoryView
                ref="view"
                className={this.props.className}
                innerClass={this.props.innerClass}
                innerStyle={this.props.innerStyle}
                noHeader={this.props.noHeader}
                headerStyle={this.props.headerStyle}
                activeTab={activeTab}
                quoteSymbol={quoteSymbol}
                baseSymbol={baseSymbol}
                tinyScreen={this.props.tinyScreen}
                historyRows={historyRows}
                totalRows={totalRows}
                showAll={showAll}
                onSetShowAll={this._onSetShowAll.bind(this)}
            />
        );
    }
}

MarketHistory.defaultProps = {
    history: []
};

MarketHistory.propTypes = {
    history: PropTypes.object.isRequired
};

export default connect(
    MarketHistory,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                viewSettings: SettingsStore.getState().viewSettings
            };
        }
    }
);
