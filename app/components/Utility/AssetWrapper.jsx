import React from "react";
import {getDisplayName} from "common/reactUtils";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import {List} from "immutable";

class DynamicObjectResolver extends React.Component {
    static propTypes = {
        dos: ChainTypes.ChainObjectsList
    };
    static defaultProps = {
        dos: List()
    };

    constructor() {
        super();

        this.getDynamicObject = this.getDynamicObject.bind(this);
    }

    getDynamicObject(id) {
        return this.props.dos.find(a => {
            return a && a.get("id") === id;
        });
    }

    render() {
        return React.cloneElement(React.Children.only(this.props.children), {
            ...this.props,
            getDynamicObject: this.getDynamicObject
        });
    }
}
DynamicObjectResolver = BindToChainState(DynamicObjectResolver);

/**
 * HOC that resolves either a number of assets directly with ChainAsset,
 * or a list of assets with ChainAssets
 *
 *  Options
 *  -'propNames' an array of prop names to be resolved as assets. (defaults to "asset" or "assets")
 *  -'defaultProps' default values to use for objects (optional)
 *  -'asList' defines whether to use ChainAssetsList or not (useful for resolving large quantities of assets)
 *  -'withDynamic' defines whether to also resolve dynamic objects or not
 */

function AssetWrapper(Component, options = {}) {
    options.propNames = options.propNames || [
        !!options.asList ? "assets" : "asset"
    ];
    const finalPropTypes = options.propNames.reduce((res, type) => {
        res[type] = options.asList
            ? ChainTypes.ChainAssetsList
            : ChainTypes.ChainAsset.isRequired;
        return res;
    }, {});

    let defaultProps = Object.keys(finalPropTypes).reduce((res, key) => {
        let current = options.defaultProps && options.defaultProps[key];
        res[key] = !!options.asList ? List(current || []) : current || "1.3.0";
        return res;
    }, {});

    if (options.defaultProps && !!options.defaultProps.tempComponent) {
        defaultProps.tempComponent = options.defaultProps.tempComponent;
    }

    class AssetsResolver extends React.Component {
        static propTypes = finalPropTypes;
        static defaultProps = defaultProps;

        render() {
            let finalAssets = {};
            let passTroughProps = {};
            let dos = List();
            Object.keys(this.props).forEach(prop => {
                if (
                    this.props[prop] &&
                    options.propNames.indexOf(prop) !== -1
                ) {
                    if (options.withDynamic) {
                        if (!options.asList) {
                            dos = dos.push(
                                this.props[prop].get("dynamic_asset_data_id")
                            );
                        } else {
                            this.props[prop].forEach(a => {
                                if (!!a)
                                    dos = dos.push(
                                        a.get("dynamic_asset_data_id")
                                    );
                            });
                        }
                    }
                    finalAssets[prop] = options.asList
                        ? this.props[prop].filter(a => !!a)
                        : this.props[prop];
                } else {
                    passTroughProps[prop] = this.props[prop];
                }
            });

            let wrapped = React.cloneElement(
                React.Children.only(this.props.children),
                {...passTroughProps, ...finalAssets}
            );

            if (options.withDynamic)
                return (
                    <DynamicObjectResolver dos={dos}>
                        {wrapped}
                    </DynamicObjectResolver>
                );
            else return wrapped;
        }
    }
    AssetsResolver = BindToChainState(AssetsResolver);

    class Wrapper extends React.Component {
        render() {
            return (
                <AssetsResolver {...this.props}>
                    <Component ref="bound_component" />
                </AssetsResolver>
            );
        }
    }
    Wrapper.displayName = `Wrapper(${getDisplayName(Component)})`;
    return Wrapper;
}

export default AssetWrapper;
