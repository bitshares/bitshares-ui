import React from "react";
import utils from "common/utils";
import asset_utils from "common/asset_utils";
import AssetWrapper from "./AssetWrapper";
import counterpart from "counterpart";
import PropTypes from "prop-types";
import {Popover} from "bitshares-ui-style-guide";
import {ChainStore, FetchChainObjects} from "bitsharesjs";

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

    constructor(props) {
        super(props);
        this.state = {
            assetIssuerName: ChainStore.getAccountName(
                props.asset.get("issuer")
            )
        };
        this._load();
    }

    shouldComponentUpdate(np, ns) {
        return (
            this.props.replace !== np.replace ||
            this.props.asset !== np.asset ||
            this.props.noPrefix !== np.noPrefix ||
            this.props.noTip !== np.noTip ||
            this.props.dataPlace !== np.dataPlace ||
            this.state.assetIssuerName !== ns.assetIssuerName
        );
    }

    _load() {
        // cache asset issuer name
        if (!this.state.assetIssuerName) {
            FetchChainObjects(ChainStore.getAccountName, [
                this.props.asset.get("issuer")
            ]).then(result => {
                console.log(result);
                // re-render, ChainStore cache now has the object
                this.setState({assetIssuerName: result[0]});
            });
        }
    }

    componentDidUpdate() {
        this._load();
    }

    render() {
        let {replace, asset, noPrefix, customClass, noTip} = this.props;
        if (!asset) return null;
        const name = asset.get("symbol");
        const assetIssuerName = this.state.assetIssuerName;
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
                    optional +
                    " " +
                    counterpart.translate("gateway.assets.bitcny");
            }

            const upperCasePrefix =
                prefix && prefix === "bit"
                    ? prefix
                    : !!prefix
                        ? prefix.toUpperCase()
                        : prefix;
            let assetDiv = (
                <div
                    className={
                        "inline-block" +
                        (this.props.noTip ? "" : " tooltip") +
                        (customClass ? " " + customClass : "")
                    }
                >
                    <span className="asset-prefix-replaced">{prefix}</span>
                    <span>{replacedName}</span>
                </div>
            );
            if (!!noTip) {
                return assetDiv;
            } else {
                let title =
                    (upperCasePrefix || "") + replacedName.toUpperCase();
                let popoverContent = (
                    <div style={{maxWidth: "25rem"}}>
                        {desc.short ? desc.short : desc.main || ""}
                        {optional !== "" && <br />}
                        {optional !== "" && <br />}
                        {optional}
                        <br />
                        <br />
                        {assetIssuerName &&
                            counterpart.translate("explorer.assets.issuer") +
                                ": " +
                                assetIssuerName}
                    </div>
                );
                return (
                    <Popover
                        placement={this.props.dataPlace}
                        content={popoverContent}
                        title={title}
                        mouseEnterDelay={0.5}
                    >
                        {assetDiv}
                    </Popover>
                );
            }
        } else {
            let assetDiv = (
                <span className={customClass ? customClass : null}>
                    <span className={!noPrefix ? "asset-prefix-replaced" : ""}>
                        {!noPrefix ? prefix : null}
                    </span>
                    <span>{replacedName}</span>
                </span>
            );
            if (!!noTip) {
                return assetDiv;
            } else {
                let desc = null;
                if (replacedName == "BTS") {
                    desc = {main: counterpart.translate("assets.BTS")};
                } else {
                    desc = asset_utils.parseDescription(
                        asset.getIn(["options", "description"])
                    );
                }
                let title = (prefix || "") + replacedName.toUpperCase();
                let popoverContent = (
                    <div style={{maxWidth: "25rem"}}>
                        {desc.short ? desc.short : desc.main || ""}
                        <br />
                        <br />
                        {assetIssuerName &&
                            counterpart.translate("explorer.assets.issuer") +
                                ": " +
                                assetIssuerName}
                    </div>
                );
                return (
                    <Popover
                        placement={this.props.dataPlace}
                        content={popoverContent}
                        title={title}
                        mouseEnterDelay={0.5}
                    >
                        {assetDiv}
                    </Popover>
                );
            }
        }
    }
}

AssetName = AssetWrapper(AssetName);

export default class AssetNameWrapper extends React.Component {
    render() {
        return <AssetName {...this.props} asset={this.props.name} />;
    }
}
