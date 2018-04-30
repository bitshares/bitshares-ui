import React from "react";
import Translate from "react-translate-component";
import AssetName from "../Utility/AssetName";
import utils from "common/utils";
import cnames from "classnames";
import ReactTooltip from "react-tooltip";

export default class PriceStatWithLabel extends React.Component {
    constructor() {
        super();
        this.state = {
            change: null,
            curMarket: null,
            marketChange: false
        };
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.volume2 && nextProps.volume2 !== this.props.volume2) {
            return true;
        }
        return (
            nextProps.price !== this.props.price ||
            nextProps.ready !== this.props.ready ||
            nextProps.volume !== this.props.volume
        );
    }

    componentWillReceiveProps(nextProps) {
        let state = {
            change: 0
        };

        let {market} = nextProps;

        let checkMarketChange = this.state.curMarket !== market;
        let marketChange =
            this.state.curMarket == null ? false : checkMarketChange;

        state["marketChange"] = marketChange;
        state["curMarket"] = market;
        state["prevAsset"] = this.state.marketAsset;

        if (nextProps.ready && this.props.ready) {
            state["change"] =
                parseFloat(nextProps.price) - parseFloat(this.props.price);
        }

        this.setState(state);
    }

    componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    render() {
        let {
            base,
            quote,
            price,
            content,
            ready,
            volume,
            toolTip,
            ignoreColorChange
        } = this.props;
        let {change, marketChange} = this.state;
        let changeClasses = null;
        if (
            !marketChange &&
            change &&
            change !== null &&
            ignoreColorChange !== true
        ) {
            changeClasses = change > 0 ? "pulsate green" : "pulsate red";
        }

        let value = "";

        if (volume) {
            const baseVolume = (
                <span>
                    {utils.format_volume(volume.base.volume) + " "}
                    <AssetName name={volume.base.asset.get("symbol")} />
                </span>
            );

            const quoteVolume = (
                <span>
                    {utils.format_volume(volume.quote.volume) + " "}
                    <AssetName name={volume.quote.asset.get("symbol")} />
                </span>
            );

            value = (
                <span>
                    {volume.swap ? quoteVolume : baseVolume}
                    {" / "}
                    {volume.swap ? baseVolume : quoteVolume}
                </span>
            );
        } else {
            value = utils.price_text(price, quote, base);
        }

        return (
            <li
                className={cnames(
                    "stressed-stat",
                    this.props.className,
                    changeClasses
                )}
                onClick={this.props.onClick}
                data-place="bottom"
                data-tip={toolTip}
            >
                <span>
                    <span className="value stat-primary">
                        {!ready ? 0 : value}&nbsp;
                    </span>
                    <span className="symbol-text">
                        {!!base && <AssetName name={base.get("symbol")} />}
                    </span>
                </span>
                {content ? (
                    <div className="stat-text">
                        <Translate content={content} />
                    </div>
                ) : null}
            </li>
        );
    }
}
