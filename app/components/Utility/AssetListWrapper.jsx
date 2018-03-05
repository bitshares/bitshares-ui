import React from "react";
import {getDisplayName} from "common/reactUtils";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import {List} from "immutable";

function AssetListWrapper(Component, options = {propNames: ["assets"]}) {
    const {propNames} = options;
    let finalPropTypes = (propNames || ["assets"]).reduce((res, type) => {
        res[type] = ChainTypes.ChainAssetsList;
        return res;
    }, {});

    let defaultProps = Object.keys(finalPropTypes).reduce((res, a) => {
        res[a] = List();
        return res;
    }, {});

    class AssetListResolver extends React.Component {
        static propTypes = finalPropTypes;
        static defaultProps = defaultProps;

        render() {
            const {propNames} = this.props;
            let finalAssets = {};
            let passTroughProps = {};
            Object.keys(this.props).forEach(prop => {
                if (propNames.indexOf(prop) !== -1) {
                    finalAssets[prop] = this.props[prop].filter(a => !!a);
                } else {
                    passTroughProps[prop] = this.props[prop];
                }
            });
            return React.cloneElement(
                React.Children.only(this.props.children),
                {...passTroughProps, ...finalAssets}
            );
        }
    }

    AssetListResolver = BindToChainState(AssetListResolver);

    class Wrapper extends React.Component {
        render() {
            return (
                <AssetListResolver propNames={propNames} {...this.props}>
                    <Component />
                </AssetListResolver>
            );
        }
    }
    Wrapper.displayName = `Wrapper(${getDisplayName(Component)})`;
    return Wrapper;
}

export default AssetListWrapper;
