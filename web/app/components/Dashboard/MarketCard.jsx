import React from "react";
import {Link, PropTypes} from "react-router";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {ChainStore} from "graphenejs-lib";
import AssetName from "../Utility/AssetName";
import assetUtils from "common/asset_utils";
import cnames from "classnames";
import MarketsActions from "actions/MarketsActions";
import MarketsStore from "stores/MarketsStore";
import connectToStores from "alt/utils/connectToStores";
import utils from "common/utils";
import Translate from "react-translate-component";

@BindToChainState()
class MarketCard extends React.Component {

    static contextTypes = {
        history: PropTypes.history
    };

    static propTypes = {
        quote: ChainTypes.ChainAsset.isRequired,
        base: ChainTypes.ChainAsset.isRequired,
        invert: React.PropTypes.bool
    };

    static defaultProps = {
        invert: true
    };

    constructor() {
        super();

        this.statsInterval = null;
    }


    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps, this.props)
        );
    }

    componentWillMount() {
        MarketsActions.getMarketStats.defer(this.props.quote, this.props.base);
        this.statsChecked = new Date();
        this.statsInterval = setInterval(MarketsActions.getMarketStats.bind(this, this.props.quote, this.props.base), 35 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.statsInterval);
    }

    goToMarket(e) {
      e.preventDefault();
      this.context.history.pushState(null, `/market/${this.props.base.get("symbol")}_${this.props.quote.get("symbol")}`);
    }

    render() {
        let {base, quote, marketStats} = this.props;

        let desc = assetUtils.parseDescription(base.getIn(["options", "description"]));
        let name = <AssetName name={base.get("symbol")} />;
        let imgName = base.get("symbol").split(".");
        imgName = imgName.length === 2 ? imgName[1] : imgName[0];

        let marketID = base.get("symbol") + "_" + quote.get("symbol");
        let stats = marketStats.get(marketID);
        let changeClass = !stats ? "" : parseFloat(stats.change) > 0 ? "change-up" : parseFloat(stats.change) < 0 ? "change-down" : "";

        if ((base.get("issuer") === "1.2.0" ||
             base.get("issuer") === "1.2.3") &&
           !(base.get("symbol") != "GOLD" ||
             base.get("symbol") != "BTC" ||
             base.get("symbol") != "EUR" ||
             base.get("symbol") != "USD" ||
             base.get("symbol") != "CNY")) {
            imgName = "bts";
        }

        return (
            <div className={cnames("grid-block no-overflow fm-container", this.props.className)} onClick={this.goToMarket.bind(this)}>
                <div className="grid-block vertical shrink">
                    <img style={{maxWidth: 70}} src={"asset-symbols/"+ imgName.toLowerCase() + ".png"} />
                </div>
                <div className="grid-block vertical no-overflow">
                    <div className="fm-title" style={{visibility: this.props.new ? "visible" : "hidden"}}><Translate content="exchange.new" /></div>
                    <div className="fm-name">{desc.short_name ? <span>{desc.short_name}</span> : <AssetName name={base.get("symbol")} />}</div>
                    <div className="fm-volume">{!stats ? null : utils.format_price(
                        stats.close.quote.amount,
                        base,
                        stats.close.base.amount,
                        quote,
                        true,
                        this.props.invert
                    )}</div>
                    <div className="fm-volume">{!stats ? null : utils.format_volume(stats.volumeBase, quote.get("precision"))} <AssetName name={quote.get("symbol")} /></div>
                    <div className={cnames("fm-change", changeClass)}>{!stats ? null : stats.change}%</div>
                </div>
            </div>
        );
    }
}

@connectToStores
export default class MarketCardWrapper extends React.Component {

    static getStores() {
        return [MarketsStore]
    };

    static getPropsFromStores() {
        return {
            marketStats: MarketsStore.getState().allMarketStats
        }
    };

  render() {

    return (
        <MarketCard {...this.props} />
    );
  }
}
