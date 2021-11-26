import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import AssetWrapper from "../Utility/AssetWrapper";
import AccountName from "../Utility/AccountName";
import utils from "common/utils";
import Icon from "../Icon/Icon";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";
import {withRouter} from "react-router-dom";
import {Tooltip} from "bitshares-ui-style-guide";

class MarketRow extends React.Component {
    static defaultProps = {
        noSymbols: false
    };

    constructor() {
        super();

        this.statsInterval = null;
    }

    _onClick(marketID) {
        const newPath = `/market/${marketID}`;
        if (newPath !== this.props.location.pathname) {
            MarketsActions.switchMarket();
            this.props.history.push(`/market/${marketID}`);
        }
    }

    componentDidMount() {
        this.statsChecked = new Date();
        if (
            this.props.base.get &&
            this.props.base.get("id") &&
            this.props.quote.get &&
            this.props.quote.get("id")
        ) {
            this.statsInterval = MarketsActions.getMarketStatsInterval(
                35 * 1000,
                this.props.base,
                this.props.quote
            );
        }
    }

    componentWillUnmount() {
        if (this.statsInterval) this.statsInterval();
    }

    shouldComponentUpdate(nextProps) {
        return !utils.are_equal_shallow(nextProps, this.props);
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
        let dynamic_data = this.props.getDynamicObject(
            quote.get("dynamic_asset_data_id")
        );
        let base_dynamic_data = this.props.getDynamicObject(
            base.get("dynamic_asset_data_id")
        );

        let price = utils.convertPrice(quote, base);

        let rowStyles = {};
        if (this.props.leftAlign) {
            rowStyles.textAlign = "left";
        }

        let buttonClass = "button outline";
        let buttonStyle = null;
        if (this.props.compact) {
            buttonClass += " no-margin";
            buttonStyle = {
                marginBottom: 0,
                fontSize: "0.75rem",
                padding: "4px 10px",
                borderRadius: "0px",
                letterSpacing: "0.05rem"
            };
        }

        let columns = this.props.columns
            .map(column => {
                switch (column.name) {
                    case "star":
                        let starClass = starred ? "gold-star" : "grey-star";
                        return (
                            <td
                                onClick={this._onStar.bind(
                                    this,
                                    quote.get("symbol"),
                                    base.get("symbol")
                                )}
                                key={column.index}
                            >
                                <Icon
                                    className={starClass}
                                    name="fi-star"
                                    title="icons.fi_star.symbol"
                                />
                            </td>
                        );

                    case "vol":
                        let amount = stats ? stats.volumeBase : 0;
                        return (
                            <td
                                onClick={this._onClick.bind(this, marketID)}
                                className="text-right"
                                key={column.index}
                            >
                                {utils.format_volume(amount)}
                            </td>
                        );

                    case "change":
                        let change = utils.format_number(
                            stats && stats.change ? stats.change : 0,
                            2
                        );
                        let changeClass =
                            change === "0.00"
                                ? ""
                                : change > 0
                                    ? "change-up"
                                    : "change-down";

                        return (
                            <td
                                onClick={this._onClick.bind(this, marketID)}
                                className={"text-right " + changeClass}
                                key={column.index}
                            >
                                {change + "%"}
                            </td>
                        );

                    case "marketName":
                        return (
                            <td
                                onClick={this._onClick.bind(this, marketID)}
                                key={column.index}
                            >
                                <div
                                    className={buttonClass}
                                    style={buttonStyle}
                                >
                                    {marketName}
                                </div>
                            </td>
                        );

                    case "market":
                        return (
                            <td
                                onClick={this._onClick.bind(this, marketID)}
                                key={column.index}
                            >
                                {this.props.name}
                            </td>
                        );

                    case "price":
                        let finalPrice =
                            stats && stats.price
                                ? stats.price.toReal()
                                : stats &&
                                  stats.close &&
                                  (stats.close.quote.amount &&
                                      stats.close.base.amount)
                                    ? utils.get_asset_price(
                                          stats.close.quote.amount,
                                          quote,
                                          stats.close.base.amount,
                                          base,
                                          true
                                      )
                                    : utils.get_asset_price(
                                          price.quote.amount,
                                          quote,
                                          price.base.amount,
                                          base,
                                          true
                                      );

                        let highPrecisionAssets = [
                            "BTC",
                            "OPEN.BTC",
                            "TRADE.BTC",
                            "GOLD",
                            "SILVER"
                        ];
                        let precision = 6;
                        if (
                            highPrecisionAssets.indexOf(base.get("symbol")) !==
                            -1
                        ) {
                            precision = 8;
                        }

                        return (
                            <td
                                onClick={this._onClick.bind(this, marketID)}
                                className="text-right"
                                key={column.index}
                            >
                                {utils.format_number(
                                    finalPrice,
                                    finalPrice > 1000
                                        ? 0
                                        : finalPrice > 10
                                            ? 2
                                            : precision
                                )}
                            </td>
                        );

                    case "quoteSupply":
                        return (
                            <td
                                onClick={this._onClick.bind(this, marketID)}
                                key={column.index}
                            >
                                {dynamic_data ? (
                                    <FormattedAsset
                                        style={{fontWeight: "bold"}}
                                        amount={parseInt(
                                            dynamic_data.get("current_supply"),
                                            10
                                        )}
                                        asset={quote.get("id")}
                                    />
                                ) : null}
                            </td>
                        );

                    case "baseSupply":
                        return (
                            <td
                                onClick={this._onClick.bind(this, marketID)}
                                key={column.index}
                            >
                                {base_dynamic_data ? (
                                    <FormattedAsset
                                        style={{fontWeight: "bold"}}
                                        amount={parseInt(
                                            base_dynamic_data.get(
                                                "current_supply"
                                            ),
                                            10
                                        )}
                                        asset={base.get("id")}
                                    />
                                ) : null}
                            </td>
                        );

                    case "issuer":
                        return (
                            <td
                                onClick={this._onClick.bind(this, marketID)}
                                key={column.index}
                            >
                                <AccountName account={quote.get("issuer")} />
                            </td>
                        );

                    case "add":
                        return (
                            <td
                                style={{textAlign: "right"}}
                                key={column.index}
                                onClick={this.props.onCheckMarket.bind(
                                    this,
                                    marketID
                                )}
                            >
                                <Tooltip
                                    title={
                                        this.props.isDefault
                                            ? "This market is a default market and cannot be removed"
                                            : null
                                    }
                                >
                                    <input
                                        type="checkbox"
                                        checked={
                                            !!this.props.isChecked ||
                                            this.props.isDefault
                                        }
                                        disabled={this.props.isDefault}
                                    />
                                </Tooltip>
                            </td>
                        );

                    case "remove":
                        return (
                            <td
                                key={column.index}
                                className="clickable"
                                onClick={this.props.removeMarket}
                            >
                                <span
                                    style={{
                                        marginBottom: "6px",
                                        marginRight: "6px",
                                        zIndex: 999
                                    }}
                                    className="text float-right remove"
                                >
                                    –
                                </span>
                            </td>
                        );

                    default:
                        break;
                }
            })
            .sort((a, b) => {
                return a.key > b.key;
            });

        let className = "clickable";
        if (this.props.current) {
            className += " activeMarket";
        }

        return (
            <tr className={className} style={rowStyles}>
                {columns}
            </tr>
        );
    }
}
MarketRow = withRouter(MarketRow);

export default AssetWrapper(MarketRow, {
    propNames: ["quote", "base"],
    defaultProps: {
        tempComponent: "tr"
    },
    withDynamic: true
});
