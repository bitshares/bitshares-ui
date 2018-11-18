import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import Translate from "react-translate-component";
import market_utils from "common/market_utils";
import PriceText from "../Utility/PriceText";
import cnames from "classnames";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import {connect} from "alt-react";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";
import {ChainTypes as grapheneChainTypes} from "bitsharesjs";
const {operations} = grapheneChainTypes;
import BlockDate from "../Utility/BlockDate";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import getLocale from "browser-locale";
import utils from "common/utils";
import {FillOrder} from "common/MarketClasses";

class MarketHistory extends React.Component {
    constructor(props) {
        super();
        this.state = {
            activeTab: props.viewSettings.get("historyTab", "history"),
            rowCount: 20,
            showAll: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.activeTab !== this.props.activeTab) {
            this._changeTab(nextProps.activeTab);
        }

        if (
            this.props.hideScrollbars &&
            nextState.showAll != this.state.showAll
        ) {
            let historyContainer = this.refs.history;
            if (!nextState.showAll) {
                Ps.destroy(historyContainer);
            } else {
                Ps.initialize(historyContainer);
                Ps.update(historyContainer);
            }
            this.refs.historyTransition.resetAnimation();
            if (historyContainer) historyContainer.scrollTop = 0;
        }

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
            let historyContainer = this.refs.history;
            if (historyContainer) Ps.initialize(historyContainer);
        }
    }

    componentDidUpdate() {
        if (
            !this.props.hideScrollbars ||
            (this.props.hideScrollbars && this.state.showAll)
        ) {
            let historyContainer = this.refs.history;
            if (historyContainer) Ps.update(historyContainer);
        }
    }

    componentWillReceiveProps(nextProps) {
        let historyContainer = this.refs.history;

        if (
            nextProps.hideScrollbars !== this.props.hideScrollbars &&
            nextProps.hideScrollbars
        ) {
            Ps.destroy(historyContainer);
        }

        if (
            nextProps.hideScrollbars !== this.props.hideScrollbars &&
            !nextProps.hideScrollbars
        ) {
            Ps.initialize(historyContainer);
            this.refs.historyTransition.resetAnimation();
            if (historyContainer) historyContainer.scrollTop = 0;
            Ps.update(historyContainer);
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
        let historyNode = this.refs.history;
        historyNode.scrollTop = 0;
        Ps.update(historyNode);

        setTimeout(ReactTooltip.rebuild, 1000);
    }

    _onSetShowAll() {
        this.setState({
            showAll: !this.state.showAll
        });

        if (this.state.showAll) {
            this.refs.history.scrollTop = 0;
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
                        <tr key={fill.id}>
                            <td className={fill.className}>
                                <PriceText
                                    price={fill.getPrice()}
                                    base={this.props.base}
                                    quote={this.props.quote}
                                />
                            </td>
                            <td>{fill.amountToReceive()}</td>
                            <td>{fill.amountToPay()}</td>
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
                            <td>{fill.amountToPay()}</td>
                            <td
                                className="tooltip"
                                style={{whiteSpace: "nowrap"}}
                                data-tip={fill.time}
                            >
                                {counterpart.localize(fill.time, {
                                    type: "date",
                                    format:
                                        getLocale()
                                            .toLowerCase()
                                            .indexOf("en-us") !== -1
                                            ? "market_history_us"
                                            : "market_history"
                                })}
                            </td>
                        </tr>
                    );
                })
                .toArray();
        }

        let emptyRow = (
            <tr>
                <td
                    style={{
                        textAlign: "center",
                        lineHeight: 4,
                        fontStyle: "italic"
                    }}
                    colSpan="5"
                >
                    <Translate content="account.no_orders" />
                </td>
            </tr>
        );

        let historyRowsLength = historyRows.length;

        if (!showAll) {
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
                                        <span className="header-sub-title">
                                            <AssetName
                                                dataPlace="top"
                                                name={baseSymbol}
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
                            maxHeight: 260,
                            overflow: "hidden",
                            lineHeight: "13px"
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
                    {historyRowsLength > 11 ? (
                        <div className="orderbook-showall">
                            <a onClick={this._onSetShowAll.bind(this)}>
                                <Translate
                                    content={
                                        showAll
                                            ? "exchange.hide"
                                            : "exchange.show_all_trades"
                                    }
                                    rowcount={historyRowsLength}
                                />
                            </a>
                        </div>
                    ) : null}
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
