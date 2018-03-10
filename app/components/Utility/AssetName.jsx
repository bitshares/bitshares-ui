import React from "react";
import utils from "common/utils";
import asset_utils from "common/asset_utils";
import AssetWrapper from "./AssetWrapper";
import counterpart from "counterpart";

class AssetName extends React.Component {
    static propTypes = {
        replace: React.PropTypes.bool.isRequired,
        dataPlace: React.PropTypes.string.isRequired
    };

    static defaultProps = {
        replace: true,
        noPrefix: false,
        noTip: false,
        dataPlace: "bottom"
    };

    shouldComponentUpdate(nextProps) {
        return !utils.are_equal_shallow(nextProps, this.props);
    }

    render() {
        let {replace, asset, noPrefix, customClass} = this.props;
        const name = asset.get("symbol");
        let isBitAsset = asset.has("bitasset");
        let isPredMarket =
            isBitAsset && asset.getIn(["bitasset", "is_prediction_market"]);

        let {name: replacedName, prefix} = utils.replaceName(
            name,
            isBitAsset && !isPredMarket && asset.get("issuer") === "1.2.0"
        );
        // let prefix = isBitAsset && !isPredMarket ? <span>bit</span> :
        // 			 replacedName !== this.props.name ? <span>{replacedPrefix}</span> : null;

        let excludeList = [
            "BTWTY",
            "BANCOR",
            "BTCSHA",
            "CROWDFUN",
            "DRAGON",
            "TESTME"
        ];
        let includeBitAssetDescription =
            isBitAsset && !isPredMarket && excludeList.indexOf(name) === -1;

        if ((replace && replacedName !== name) || isBitAsset) {
            let desc = asset_utils.parseDescription(
                asset.getIn(["options", "description"])
            );
            let realPrefix = name.split(".");
            realPrefix = realPrefix.length > 1 ? realPrefix[0] : null;
            if (realPrefix) realPrefix += ".";
            let optional = "";
            try {
                optional =
                    realPrefix || includeBitAssetDescription
                        ? counterpart.translate(
                              "gateway.assets." +
                                  (isBitAsset
                                      ? "bit"
                                      : realPrefix
                                            .replace(".", "")
                                            .toLowerCase()),
                              {
                                  asset: name,
                                  backed: includeBitAssetDescription
                                      ? desc.main
                                      : replacedName
                              }
                          )
                        : "";
            } catch (e) {}
            if (isBitAsset && name === "CNY") {
                optional =
                    optional + counterpart.translate("gateway.assets.bitcny");
            }
            let tooltip = this.props.noTip
                ? null
                : `<div><strong>${
                      includeBitAssetDescription
                          ? "bit"
                          : (realPrefix
                                ? realPrefix.toUpperCase()
                                : realPrefix) || ""
                  }${replacedName}</strong><br />${
                      includeBitAssetDescription
                          ? ""
                          : "<br />" +
                            (desc.short ? desc.short : desc.main || "")
                  }${
                      !isBitAsset || includeBitAssetDescription ? optional : ""
                  }</div>`;

            return (
                <div
                    className={
                        "inline-block" +
                        (this.props.noTip ? "" : " tooltip") +
                        (customClass ? " " + customClass : "")
                    }
                    data-tip={tooltip}
                    data-place={this.props.dataPlace}
                    data-html={true}
                >
                    <span className="asset-prefix-replaced">{prefix}</span>
                    <span>{replacedName}</span>
                </div>
            );
        } else {
            return (
                <span className={customClass ? customClass : null}>
                    <span className={!noPrefix ? "asset-prefix-replaced" : ""}>
                        {!noPrefix ? prefix : null}
                    </span>
                    {replacedName}
                </span>
            );
        }
    }
}

AssetName = AssetWrapper(AssetName);

export default class AssetNameWrapper extends React.Component {
    render() {
        return <AssetName {...this.props} asset={this.props.name} />;
    }
}
