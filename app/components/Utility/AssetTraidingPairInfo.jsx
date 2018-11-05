import React from "react";
import assetUtils from "common/asset_utils";

export default class AssetTradingPairInfo extends React.Component {
    render() {
        const {asset, deposit} = this.props;

        const labelStyle = {
            whiteSpace: "normal",
            lineHeight: 1.4
        };

        const tradingPairMessages = assetUtils
            .getTradingPairInfoMessages(asset, deposit)
            .map((info, i) => {
                return (
                    <label
                        className="label warning"
                        key={"tradingPairInfo" + i}
                        style={labelStyle}
                    >
                        {info.message}
                    </label>
                );
            });

        return tradingPairMessages.length ? tradingPairMessages : null;
    }
}
