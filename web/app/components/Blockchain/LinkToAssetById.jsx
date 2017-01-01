import React from "react";
import {Link} from "react-router";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

class LinkToAssetById extends React.Component {
    static propTypes = {
        asset: ChainTypes.ChainObject.isRequired
    }
    render() {
        let symbol = this.props.asset.get("symbol");
        return <Link to={`/asset/${symbol}/`}>{symbol}</Link>;
    }
}

export default BindToChainState(LinkToAssetById);
