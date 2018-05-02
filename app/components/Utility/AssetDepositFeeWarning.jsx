import React from "react";
import Translate from "react-translate-component";

export default class AssetDepositFeeWarning extends React.Component {
    render() {
        const {asset} = this.props;

        const labelStyle = {
            whiteSpace: "normal",
            lineHeight: 1.4
        };

        return asset && asset.depositFeeEnabled ? (
            <Translate
                component="label"
                className="label warning"
                style={labelStyle}
                content="cryptobridge.gateway.deposit_to_fee_warning"
                with={{
                    asset: asset.name,
                    fee_time_frame: asset.depositFeeTimeframe,
                    fee_percentage: asset.depositFeePercentage,
                    fee_percentage_low_amounts:
                        asset.depositFeePercentageLowAmounts,
                    fee_minimum: asset.depositFeeMinimum
                }}
            />
        ) : (
            <span />
        );
    }
}
