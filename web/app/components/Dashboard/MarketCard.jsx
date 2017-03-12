import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetName from "../Utility/AssetName";
import assetUtils from "common/asset_utils";
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

		let desc = assetUtils.parseDescription(base.getIn(["options", "description"]));
		function getImageName(asset) {
			let symbol = asset.get("symbol");
			if (symbol === "OPEN.BTC") return symbol;
			let imgName = asset.get("symbol").split(".");
			return imgName.length === 2 ? imgName[1] : imgName[0];
		}
		let imgName = getImageName(base);

		let marketID = base.get("symbol") + "_" + quote.get("symbol");
		let stats = marketStats.get(marketID);
		let changeClass = !stats ? "" : parseFloat(stats.change) > 0 ? "change-up" : parseFloat(stats.change) < 0 ? "change-down" : "";

		return (
			<div className={cnames("grid-block no-overflow fm-container", this.props.className)} onClick={this.goToMarket.bind(this)}>
				<div className="grid-block vertical shrink">
					<div className="v-align">
						<img className="align-center" ref={imgName.toLowerCase()} onError={this._onError.bind(this, imgName)} style={{maxWidth: 70}} src={"asset-symbols/"+ imgName.toLowerCase() + ".png"} />
					</div>
				</div>
				<div className="grid-block vertical no-overflow">
					<div className="fm-name"><AssetName name={base.get("symbol")} /> : <AssetName name={quote.get("symbol")} /></div>
					<div className="fm-volume">price: <div className="float-right">{(!stats || !stats.close) ? null : utils.format_price(
						stats.close.quote.amount,
						base,
						stats.close.base.amount,
						quote,
						true,
						this.props.invert
					)}</div></div>
					<div className="fm-volume">volume: <div className="float-right">{!stats ? null : utils.format_volume(stats.volumeBase, quote.get("precision"))}</div></div>
					<div className="fm-change">change: <div className={cnames("float-right", changeClass)}>{!stats ? null : stats.change}%</div></div>
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
	getProps() {
		return {
			marketStats: MarketsStore.getState().allMarketStats
		};
	}
});
