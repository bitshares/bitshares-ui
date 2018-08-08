import React from "react";
import utils from "common/utils";
import asset_utils from "common/asset_utils";
import AssetWrapper from "./AssetWrapper";
import counterpart from "counterpart";
import PropTypes from "prop-types";

class AssetName extends React.Component {
    static propTypes = {
        replace: PropTypes.bool.isRequired,
        dataPlace: PropTypes.string.isRequired
    };

    static defaultProps = {
        replace: true,
        noPrefix: false,
        noTip: false,
        dataPlace: "bottom"
    };

    shouldComponentUpdate(np) {
        return (
            this.props.replace !== np.replace ||
            this.props.asset !== np.asset ||
            this.props.noPrefix !== np.noPrefix ||
            this.props.noTip !== np.noTip ||
            this.props.dataPlace !== np.dataPlace
        );
    }

    render() {
        let {replace, asset, noPrefix, customClass, noTip} = this.props;
        if (!asset) return null;
        const name = asset.get("symbol");

        const isBridgeCoinAsset = asset_utils.isBridgeCoinAsset(asset);
        if (isBridgeCoinAsset) noPrefix = true;

        const isBitAsset = asset.has("bitasset");
        const isPredMarket =
            isBitAsset && asset.getIn(["bitasset", "is_prediction_market"]);

        let {name: replacedName, prefix} = utils.replaceName(asset);
        const hasBitPrefix = prefix === "bit";

        let includeBitAssetDescription =
            isBitAsset && !isPredMarket && hasBitPrefix;

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
                                  (hasBitPrefix
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

            const upperCasePrefix =
                prefix && prefix === "bit"
                    ? prefix
                    : !!prefix
                        ? prefix.toUpperCase()
                        : prefix;
            let tooltip = noTip
                ? null
                : `<div><strong>${upperCasePrefix ||
                      ""}${replacedName.toUpperCase()}</strong><br />${
                      includeBitAssetDescription
                          ? ""
                          : "<br />" +
                            (desc.short ? desc.short : desc.main || "")
                  }${
                      !isBitAsset || includeBitAssetDescription ? optional : ""
                  }</div>`;

            if (this.props.onRenderedName) {
                this.props.onRenderedName(replacedName);
            }

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
                    {!isBridgeCoinAsset && (
                        <span className="asset-prefix-replaced">{prefix}</span>
                    )}
                    <span>{replacedName}</span>
                </div>
            );
        } else {
            return (
                <span className={customClass ? customClass : null}>
                    <span className={!noPrefix ? "asset-prefix-replaced" : ""}>
                        {!noPrefix ? prefix : null}
                    </span>
                    <span>{replacedName}</span>
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
