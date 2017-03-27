import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetName from "../Utility/AssetName";
import cnames from "classnames";
import MarketsActions from "actions/MarketsActions";
import MarketsStore from "stores/MarketsStore";
import { connect } from "alt-react";
import utils from "common/utils";
import Translate from "react-translate-component";

class MarketCard extends React.Component {

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

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

        this.state = {
            imgError: false
        };
    }

    _checkStats(newStats = {close: {}}, oldStats = {close: {}}) {
        return (
            newStats.volumeBase !== oldStats.volumeBase ||
            !utils.are_equal_shallow(newStats.close && newStats.close.base, oldStats.close && oldStats.close.base) ||
            !utils.are_equal_shallow(newStats.close && newStats.close.quote, oldStats.close && oldStats.close.quote)
        );
    }

    shouldComponentUpdate(np, ns) {
        return (
            this._checkStats(np.marketStats, this.props.marketStats) ||
            np.base !== this.props.base ||
            np.quote !== this.props.quote ||
            ns.imgError !== this.state.imgError
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
        this.context.router.push(`/market/${this.props.base.get("symbol")}_${this.props.quote.get("symbol")}`);
    }

    _onError(imgName) {
        if (!this.state.imgError) {
            this.refs[imgName.toLowerCase()].src = "asset-symbols/bts.png";
            this.setState({
                imgError: true
            });
        }

    }

    render() {
        let {hide, isLowVolume, base, quote, marketStats} = this.props;
        if (isLowVolume || hide) return null;

        function getImageName(asset) {
            let symbol = asset.get("symbol");
            if (symbol === "OPEN.BTC") return symbol;
            let imgName = asset.get("symbol").split(".");
            return imgName.length === 2 ? imgName[1] : imgName[0];
        }
        let imgName = getImageName(base);

        // let marketID = base.get("symbol") + "_" + quote.get("symbol");
        // let stats = marketStats;
        let changeClass = !marketStats ? "" : parseFloat(marketStats.change) > 0 ? "change-up" : parseFloat(marketStats.change) < 0 ? "change-down" : "";

        return (
            <div className={cnames("grid-block no-overflow fm-container", this.props.className)} onClick={this.goToMarket.bind(this)}>
                <div className="grid-block vertical shrink">
                    <div className="v-align">
                        <img className="align-center" ref={imgName.toLowerCase()} onError={this._onError.bind(this, imgName)} style={{maxWidth: 70}} src={"asset-symbols/"+ imgName.toLowerCase() + ".png"} />
                    </div>
                </div>
                <div className="grid-block vertical no-overflow">
                    <div className="fm-name"><AssetName name={base.get("symbol")} /> : <AssetName name={quote.get("symbol")} /></div>
                    {/* <div className="fm-volume">price: <div className="float-right">{(!marketStats || !marketStats.close) ? null : utils.format_price(
                        marketStats.close.quote.amount,
                        base,
                        marketStats.close.base.amount,
                        quote,
                        true,
                        this.props.invert
                    )}</div></div> */}
                    <div className="fm-volume"><Translate content="exchange.price" />: <div className="float-right">{marketStats && marketStats.price ? utils.price_text(marketStats.price.toReal(), base, quote) : null}</div></div>
                    <div className="fm-volume"><Translate content="exchange.volume" />: <div className="float-right">{!marketStats ? null : utils.format_volume(marketStats.volumeBase, quote.get("precision"))}</div></div>
                    <div className="fm-change"><Translate content="exchange.change" />: <div className={cnames("float-right", changeClass)}>{!marketStats ? null : marketStats.change}%</div></div>
                </div>
            </div>
        );
    }
}

MarketCard = BindToChainState(MarketCard);

class MarketCardWrapper extends React.Component {
    render() {
        return (
            <MarketCard {...this.props} />
        );
    }
}

export default connect(MarketCardWrapper, {
    listenTo() {
        return [MarketsStore];
    },
    getProps(props) {
        return {
            marketStats: MarketsStore.getState().allMarketStats.get(props.marketId)
        };
    }
});
