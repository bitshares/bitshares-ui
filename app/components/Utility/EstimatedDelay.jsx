import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";
import utils from "common/utils";
import AssetWrapper from "./AssetWrapper";

function EstimatedDelay({ getDynamicObject, asset, core, amount }) {
    const dynamic = getDynamicObject(asset.get("dynamic_asset_data_id"));
    const currentSupply = dynamic && dynamic.size ?
        dynamic.get("current_supply") :
        0;
    const maintenanceInterval = core && core.size ?
        core.getIn(["parameters", "maintenance_interval"]) :
        0;
    const bitAsset = asset.get("bitasset").toJS();
    const maxSettlementVolume = currentSupply *
            (bitAsset.options.maximum_force_settlement_volume / 10000);
    const settlementDelay = bitAsset.options.force_settlement_delay_sec;
    const requestedVolume = amount / utils.get_asset_precision(asset.get("precision"));

    const estimatedDelay = (settlementDelay +
            Math.floor(requestedVolume / maxSettlementVolume) *
            maintenanceInterval) / 3600;

    return <span>{estimatedDelay}</span>;
}

EstimatedDelay.propTypes = {
    asset: PropTypes.instanceOf(Immutable.Map),
    core: PropTypes.instanceOf(Immutable.Map),
    amount: PropTypes.number
};

EstimatedDelay.defaultProps = {
    asset: Immutable.Map(),
    core: Immutable.Map(),
    amount: 0
};

export default AssetWrapper(EstimatedDelay, {
    propNames: ["asset", "core"],
    withDynamic: true,
    defaultProps: { core: "2.0.0" }
});
