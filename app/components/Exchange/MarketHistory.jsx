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
    MarketHistoryViewRow
} from "./View/MarketHistoryView";

class MarketHistory extends React.Component {
    constructor(props) {
        super();
        this.state = {
            activeTab: props.viewSettings.get("historyTab", "history"),
            rowCount: 100,
            showAll: false
        };
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
            this.updateContainer(1);
        }
    }

    componentDidUpdate(prevState) {
        let {hideScrollbars} = this.props;
        let {showAll} = this.state;

        if (prevState.showAll != showAll) {
            if (showAll && !hideScrollbars) {
                this.updateContainer(2);
            } else if (!showAll && !hideScrollbars) {
                this.updateContainer(3);
            } else if (showAll && hideScrollbars) {
                this.updateContainer(1);
            } else {
                this.updateContainer(0);
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.activeTab !== this.props.activeTab) {
            this.changeTab(nextProps.activeTab);
        }

        // Reset on Market Switch
        if (
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol
        ) {
            this.setState({showAll: false});
            this.updateContainer(0);

            if (!this.props.hideScrollbars) {
                this.updateContainer(1);
            }
        }

        // Reset on hideScrollbars switch
        if (nextProps.hideScrollbars !== this.props.hideScrollbars) {
            this.updateContainer(0);

            if (!nextProps.hideScrollbars) {
                this.updateContainer(1);
            }
        }
    }

    /***
     * Update PS Container
     * type:int [0:destroy, 1:init, 2:update, 3:update w/ scrollTop] (default: 2)
     */
    updateContainer(type = 2) {
        let containerNode = this.refs.view.refs.history;
        let containerTransition = this.refs.view.refs.historyTransition;

        if (!containerNode) return;

        if (type == 0) {
            containerNode.scrollTop = 0;
            Ps.destroy(containerNode);
        } else if (type == 1) {
            Ps.initialize(containerNode);
            this.updateContainer(3);
        } else if (type == 2) {
            Ps.update(containerNode);
        } else if (type == 3) {
            containerNode.scrollTop = 0;
            Ps.update(containerNode);
        }

        if (containerTransition) {
            containerTransition.resetAnimation();
        }
    }

    onSetShowAll() {
        this.setState({
            showAll: !this.state.showAll
        });
    }

    changeTab(tab) {
        SettingsActions.changeViewSetting({
            historyTab: tab
        });
        this.setState({
            activeTab: tab
        });

        // Ensure that focus goes back to top of scrollable container when tab is changed
        this.updateContainer(3);

        setTimeout(ReactTooltip.rebuild, 1000);
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

        if (activeTab === "my_history" && (myHistory && myHistory.size)) {
            // User History

            const assets = {
                [quote.get("id")]: {
                    precision: quote.get("precision")
                },
                [base.get("id")]: {
                    precision: base.get("precision")
                }
            };

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
                        <tr key={fill.id}>
                            <td className={fill.className}>
                                <PriceText
                                    price={fill.getPrice()}
                                    base={this.props.base}
                                    quote={this.props.quote}
                                />
                            </td>
                            <td>{fill.amountToReceive()}</td>
                            <BlockDate
                                component="td"
                                block_number={fill.block}
                                tooltip
                            />
                        </tr>
                    );
                })
                .toArray();
        } else if (history && history.size) {
            // Market History
            historyRows = this.props.history
                .take(100)
                .map(fill => {
                    return (
                        <tr key={"history_" + fill.id}>
                            <td className={fill.className}>
                                <PriceText
                                    price={fill.getPrice()}
                                    base={this.props.base}
                                    quote={this.props.quote}
                                />
                            </td>
                            <td>{fill.amountToReceive()}</td>
                            <td>
                                <Tooltip title={fill.time.toString()}>
                                    <div
                                        className="tooltip"
                                        style={{whiteSpace: "nowrap"}}
                                    >
                                        {counterpart
                                            .localize(fill.time, {
                                                type: "time",
                                                format:
                                                    "long" /*
                                                getLocale()
                                                    .toLowerCase()
                                                    .indexOf("en-us") !== -1
                                                    ? "market_history_us"
                                                    : "market_history"*/
                                            })
                                            .slice(0, 8)}
                                    </div>
                                </Tooltip>
                            </td>
                        </tr>
                    );
                })
                .toArray();
        }
        let emptyRow = (
            <tr>
                <td
                    className="centric-items"
                    style={{
                        lineHeight: 4,
                        fontStyle: "italic"
                    }}
                    colSpan="5"
                >
                    <Translate content="account.no_orders" />
                </td>
            </tr>
        );
        if (!showAll && historyRows) {
            historyRows.splice(rowCount, historyRows.length);
        }

        return (
            <div className={cnames(this.props.className)}>
                <div
                    className={this.props.innerClass}
                    style={this.props.innerStyle}
                >
                    {this.props.noHeader ? null : (
                        <div
                            style={this.props.headerStyle}
                            className="exchange-content-header"
                        >
                            {activeTab === "my_history" ? (
                                <Translate content="exchange.my_history" />
                            ) : null}
                            {activeTab === "history" ? (
                                <Translate content="exchange.history" />
                            ) : null}
                        </div>
                    )}
                    <div className="grid-block shrink left-orderbook-header market-right-padding-only">
                        <table className="table table-no-padding order-table text-left fixed-table market-right-padding">
                            <thead>
                                <tr>
                                    <th style={{textAlign: "right"}}>
                                        <Translate
                                            className="header-sub-title"
                                            content="exchange.price"
                                        />
                                    </th>
                                    <th style={{textAlign: "right"}}>
                                        <span className="header-sub-title">
                                            <AssetName
                                                dataPlace="top"
                                                name={quoteSymbol}
                                            />
                                        </span>
                                    </th>
                                    <th style={{textAlign: "right"}}>
                                        <Translate
                                            className="header-sub-title"
                                            content="explorer.block.date"
                                        />
                                    </th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div
                        className="table-container grid-block market-right-padding-only no-overflow"
                        ref="history"
                        style={{
                            minHeight: !this.props.tinyScreen ? 260 : 0,
                            maxHeight: this.props.chartHeight - 2,
                            overflow: "auto",
                            lineHeight: "10px"
                        }}
                    >
                        <table className="table order-table no-stripes table-hover fixed-table text-right no-overflow">
                            <TransitionWrapper
                                ref="historyTransition"
                                component="tbody"
                                transitionName="newrow"
                                className="orderbook"
                            >
                                {!!historyRows && historyRows.length > 0
                                    ? historyRows
                                    : emptyRow}
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
