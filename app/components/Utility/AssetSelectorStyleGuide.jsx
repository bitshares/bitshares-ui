import React, {PureComponent} from "react";
import counterpart from "counterpart";
import AssetWrapper from "./AssetWrapper";
import {ChainStore} from "bitsharesjs";
import PropTypes from "prop-types";
import {Form, Input, Select} from "bitshares-ui-style-guide";
import ChainTypes from "../Utility/ChainTypes";
import Icon from "../Icon/Icon";

const isAssetObj = asset => !!(asset && typeof asset.get === "function");

const getAsset = async sym => ChainStore.getAsset(sym);

const AssetSelectorLabelView = ({label, asset, noValidation}) => (
    <div className="asset-selector-label">
        <div>{counterpart.translate(label)}</div>
        {!noValidation && (
            <Icon
                name={isAssetObj(asset) ? "checkmark-circle" : "cross-circle"}
            />
        )}
    </div>
);

const AssetSelectorLabel = AssetWrapper(AssetSelectorLabelView, {
    optional: true
});

class AssetSelector extends PureComponent {
    static propTypes = {
        // common
        selectMode: PropTypes.bool, // if true, forces select mode
        assets: PropTypes.array, // an array of assets. If not provided, the component will display in text input mode
        asset: ChainTypes.ChainAsset, // the selected asset
        placeholder: PropTypes.string, // the placeholder text to be displayed when there is preselected value
        onChange: PropTypes.func, // a method to be called when the selection or input changes
        onSelect: PropTypes.func, // a method to be called when the selection changed only, the asset symbol is passed as argument
        onFound: PropTypes.func, // a method to be called when a valid asset is found, the asset object is passed as argument
        style: PropTypes.object, // style to pass to the containing component
        label: PropTypes.string, // a translation key for the left label
        formItemStyle: PropTypes.object, // form item component style (used only if a label is passed)

        // select mode
        selectStyle: PropTypes.object, // select component style (select mode only)

        // text mode
        inputStyle: PropTypes.object, // text input component style (text input mode only)
        assetInput: PropTypes.string // the current value of the asset selector, the string the user enters
    };

    handleSelect = value => {
        const {asset: assetProp, assets, onSelect, onFound} = this.props;
        if (typeof onSelect === "function")
            onSelect(typeof value === "object" ? value.get("symbol") : value);

        if (typeof onFound === "function") {
            let asset;
            if (typeof value === "object") asset = value;
            else
                asset = assets.find(
                    ownAsset => ownAsset.get("symbol") === value
                );
            if (
                !asset &&
                isAssetObj(assetProp) &&
                value === assetProp.get("symbol")
            )
                asset = assetProp;
            if (asset) onFound(asset);
        }
    };

    handleInputChange = e => {
        const symbol = e.target.value;
        const {onChange, onSelect, onFound} = this.props;

        if (typeof onChange === "function") onChange(symbol);

        if (typeof onSelect === "function" || typeof onFound === "function") {
            getAsset(symbol).then(asset => asset && this.handleSelect(asset));
        }
    };

    render() {
        const {
            label,
            asset,
            assetInput,
            assets,
            selectStyle,
            onChange,
            onSelect,
            placeholder,
            formItemStyle,
            inputStyle,
            style,
            selectMode: selectModeProp
        } = this.props;

        const value = isAssetObj(asset) && asset.get("symbol");

        const selectMode = selectModeProp || assets.length !== 0;

        const select = selectMode ? (
            <Select
                showSearch
                value={value || undefined}
                style={selectStyle}
                onChange={onChange}
                onSelect={this.handleSelect}
                placeholder={placeholder}
            >
                {assets.filter(isAssetObj).map(asset => {
                    return (
                        <Select.Option key={asset.get("symbol")}>
                            {asset.get("symbol")}
                        </Select.Option>
                    );
                })}
            </Select>
        ) : (
            <Input
                value={assetInput}
                onChange={this.handleInputChange}
                style={inputStyle}
            />
        );

        return (
            <div className="asset-selector" style={style}>
                {label ? (
                    <Form.Item
                        colon={false}
                        label={
                            <AssetSelectorLabel
                                label={label}
                                noValidation={selectMode}
                                asset={assetInput || " "}
                            />
                        }
                        labelCol={{span: 12, offset: 0}}
                        style={formItemStyle}
                    >
                        {select}
                    </Form.Item>
                ) : (
                    select
                )}
            </div>
        );
    }
}

AssetSelector = AssetWrapper(
    AssetWrapper(AssetSelector, {propNames: ["assets"], asList: true}),
    {propNames: ["asset"], optional: true, defaultProps: {asset: " "}}
);

export default AssetSelector;
