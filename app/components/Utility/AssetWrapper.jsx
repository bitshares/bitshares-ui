import React from "react";
import {getDisplayName} from "common/reactUtils";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";

function AssetWrapper(Component, options = {propName: "asset"}) {
    const {propName, propNames} = options;

    const finalPropTypes = (propNames || ["asset"]).reduce((res, a) => {
        res[a] = ChainTypes.ChainAsset.isRequired;
        return res;
    }, {});

    class AssetResolver extends React.Component {
        static propTypes = finalPropTypes;
        static defaultProps = options.defaultProps || {asset: "1.3.0"};

        render() {
            const {propName, asset, ...others} = this.props;
            return React.cloneElement(
                React.Children.only(this.props.children),
                {...others, [propName]: asset}
            );
        }
    }
    AssetResolver = BindToChainState(AssetResolver);

    class Wrapper extends React.Component {
        render() {
            const asset = this.props[propName];
            return (
                <AssetResolver
                    propName={propName}
                    {...this.props}
                    asset={asset}
                >
                    <Component />
                </AssetResolver>
            );
        }
    }
    Wrapper.displayName = `Wrapper(${getDisplayName(Component)})`;
    return Wrapper;
}

export default AssetWrapper;
