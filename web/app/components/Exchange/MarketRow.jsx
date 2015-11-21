import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import Link from "react-router";
import Icon from "../Icon/Icon";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";

@BindToChainState()
class MarketRow extends React.Component {

    static propTypes = {
        quote: ChainTypes.ChainAsset.isRequired,
        base: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        noSymbols: false,
        tempComponent: "tr"        
    };

    static contextTypes = {router: React.PropTypes.func.isRequired};

    constructor() {
        super();

        this.statsInterval = null;
    }

    _onClick(marketID) {
        this.context.router.transitionTo("exchange", {marketID: marketID});
    }

    componentDidMount() {
        MarketsActions.getMarketStats(this.props.base, this.props.quote);
        this.statsChecked = new Date();
        this.statsInterval = setInterval(MarketsActions.getMarketStats.bind(this, this.props.base, this.props.quote), 35 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.statsInterval);
    }

    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps, this.props)
        )
    }

    _onStar(quote, base, e) {
        e.preventDefault();
        if (!this.props.starred) {
            SettingsActions.addStarMarket(quote, base);
        } else {
            SettingsActions.removeStarMarket(quote, base);
        }
    }

    render() {
        let {quote, base, noSymbols, stats, starred} = this.props;

        if (!quote || !base) {
            return null;
        }

        let marketID = quote.get("symbol") + "_" + base.get("symbol");
        let marketName = quote.get("symbol") + ":" + base.get("symbol");
        let dynamic_data = quote.get("dynamic");
        let base_dynamic_data = base.get("dynamic");

        let price = utils.convertPrice(quote, base);

        let rowStyles = {};
        if (this.props.leftAlign) {
            rowStyles.textAlign = "left";
        }

        let buttonClass = "button outline";
        let buttonStyle = null;
        if (this.props.compact) {
            buttonClass += " no-margin";
            buttonStyle = {marginBottom: 0, fontSize: "0.75rem" , padding: "4px 10px" , borderRadius: "0px" , letterSpacing: "0.05rem"}
        }

        let columns = this.props.columns.map(column => {
            switch (column.name) {
                case "star":
                    let starClass = starred ? "gold-star" : "grey-star";
                    return (
                        <td onClick={this._onStar.bind(this, quote.get("symbol"), base.get("symbol"))} key={column.index}>
                            <Icon className={starClass} name="fi-star"/>
                        </td>
                    );

                case "vol":
                    let amount = stats ? stats.volumeQuote : 0;
                    return (
                        <td onClick={this._onClick.bind(this, marketID)} className="text-right" key={column.index}>
                            {utils.format_volume(amount)}
                        </td>
                    );

                case "change":
                    let change = utils.format_number(stats && stats.change ? stats.change : 0, 2);
                    let changeClass = change === "0.00" ? "" : change > 0 ? "positive-change" : "negative-change";

                    return (
                        <td onClick={this._onClick.bind(this, marketID)} className={"text-right " + changeClass} key={column.index}>
                            {change + "%"}
                        </td>
                    );

                case "marketName":
                    return (
                        <td onClick={this._onClick.bind(this, marketID)} key={column.index}>
                            <div className={buttonClass} style={buttonStyle}>{marketName}</div>
                        </td>
                    );

                case "market":
                    return (<td onClick={this._onClick.bind(this, marketID)} key={column.index}>
                            {marketName}
                        </td>);

                case "price":
                    let finalPrice = stats && stats.latestPrice ?
                        stats.latestPrice :
                        stats && (stats.close.quote && stats.close.base) ?
                        utils.get_asset_price(stats.close.quote, quote, stats.close.base, base, true) :
                        utils.get_asset_price(price.baseAmount, base, price.quoteAmount, quote)

                    return (
                        <td onClick={this._onClick.bind(this, marketID)} className="text-right" key={column.index}>
                            {utils.format_number(finalPrice, 6)}
                        </td>
                    )

                case "quoteSupply":
                    return (
                        <td onClick={this._onClick.bind(this, marketID)} key={column.index}>
                            {dynamic_data ? <FormattedAsset
                                style={{fontWeight: "bold"}}
                                amount={parseInt(dynamic_data.get("current_supply"), 10)}
                                asset={quote.get("id")}/> : null}
                        </td>
                    );

                case "baseSupply":
                    return (
                        <td onClick={this._onClick.bind(this, marketID)} key={column.index}>
                            {base_dynamic_data ? <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={parseInt(base_dynamic_data.get("current_supply"), 10)}
                            asset={base.get("id")}/> : null}
                        </td>
                    );

                case "remove":
                    return (
                        <td key={column.index} className="clickable" onClick={this.props.removeMarket}>
                            <span style={{marginBottom: "6px", marginRight: "6px", zIndex: 999}} className="text float-right remove">–</span>
                        </td>
                    )

                default:
                    break;
            }

        }).sort((a,b) => {
            return a.key > b.key;
        });

        return (
            <tr className="clickable" style={rowStyles}>{columns}</tr>
        );
    }
}

export default MarketRow;
