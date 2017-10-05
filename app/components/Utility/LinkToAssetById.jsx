import React from "react";
import {Link} from "react-router/es";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import AssetName from "./AssetName";

class LinkToAssetById extends React.Component {
    static propTypes = {
        asset: ChainTypes.ChainObject.isRequired
    }
    render() {
        const symbol = this.props.asset.get("symbol");
        const assetName = <AssetName name={symbol} noTip />;
        return this.props.noLink ? assetName : <Link to={`/asset/${symbol}/`}>{assetName}</Link>;
    }
}

export default BindToChainState(LinkToAssetById);
