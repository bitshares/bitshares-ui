import React from "react";
import utils from "common/utils";
import asset_utils from "common/asset_utils";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import counterpart from "counterpart";

class AssetName extends React.Component {

	static propTypes = {
		asset: ChainTypes.ChainAsset.isRequired,
		replace: React.PropTypes.bool.isRequired,
		name: React.PropTypes.string.isRequired
	};

	static defaultProps = {
		replace: true,
		noPrefix: false
	};

	shouldComponentUpdate(nextProps) {
		return (
			nextProps.replace !== this.props.replace ||
			nextProps.name !== this.props.replace
		);
	}

	render() {
		let {name, replace, asset, noPrefix} = this.props;
		let isBitAsset = asset.has("bitasset");
		let isPredMarket = isBitAsset && asset.getIn(["bitasset", "is_prediction_market"]);

		let {name: replacedName, prefix} = utils.replaceName(name, isBitAsset && !isPredMarket && asset.get("issuer") === "1.2.0");
		// let prefix = isBitAsset && !isPredMarket ? <span>bit</span> :
		// 			 replacedName !== this.props.name ? <span>{replacedPrefix}</span> : null;

		let excludeList = ["BTWTY", "BANCOR", "BTCSHA", "CROWDFUN", "DRAGON", "TESTME"];
		let includeBitAssetDescription = isBitAsset && !isPredMarket && excludeList.indexOf(name) === -1;

		if (replace && replacedName !== this.props.name || isBitAsset) {
			let desc = asset_utils.parseDescription(asset.getIn(["options", "description"]));
			let realPrefix = name.split(".");
			realPrefix = realPrefix.length > 1 ? realPrefix[0] : null;
			let	optional = realPrefix ? counterpart.translate("gateway.assets." + realPrefix.replace(".", "").toLowerCase(), {asset: name, backed: includeBitAssetDescription ? desc.main : replacedName}) : "";

			if (isBitAsset && name === "CNY") {
				optional = optional + counterpart.translate("gateway.assets.bitcny");
			}
			let tooltip = `<div><strong>${!isBitAsset && realPrefix ? realPrefix.toUpperCase() : realPrefix || ""}${replacedName}</strong><br />${includeBitAssetDescription ? "" : "<br />" + (desc.short ? desc.short : desc.main || "")}${!isBitAsset || includeBitAssetDescription ? optional : ""}</div>`;

			return (
				<div
					className="tooltip inline-block"
					data-tip={tooltip}
					data-place="bottom"
					data-html={true}
				>
					<span className="asset-prefix-replaced">{prefix}</span><span>{replacedName}</span>
				</div>
			);
		} else {
			return <span><span className={!noPrefix ? "asset-prefix-replaced" : ""}>{!noPrefix ? prefix : null}</span>{name}</span>;
		}

	}
}

AssetName = BindToChainState(AssetName);

export default class AssetNameWrapper extends React.Component {

	render() {
		return (
			<AssetName {...this.props} asset={this.props.name} />
		);
	}
}
