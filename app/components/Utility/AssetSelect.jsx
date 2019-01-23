import React, {PureComponent} from "react";
import Translate from "react-translate-component";
import PropTypes from "prop-types";
import {Form, Select} from "bitshares-ui-style-guide";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {Map} from "immutable";
import utils from "../../lib/common/utils";

const replaceName = asset => {
    let {name, prefix} = utils.replaceName(asset);
    return prefix + "" + name;
};

const AssetSelectView = ({
    label,
    assets,
    selectStyle,
    formItemStyle,
    style,
    placeholder,
    ...props
}) => {
    const select = (
        <Select
            showSearch
            style={selectStyle}
            placeholder={
                <Translate
                    content={placeholder || "utility.asset_select_placeholder"}
                />
            }
            {...props}
        >
            {assets.filter(Map.isMap).map(asset => (
                <Select.Option key={asset.get("symbol")}>
                    {replaceName(asset)}
                </Select.Option>
            ))}
        </Select>
    );
    return (
        <div className={"asset-select"} style={style}>
            {label ? (
                <Form.Item
                    colon={false}
                    label={<Translate content={label} />}
                    style={formItemStyle}
                >
                    {select}
                </Form.Item>
            ) : (
                select
            )}
        </div>
    );
};

AssetSelectView.propTypes = {
    assets: ChainTypes.ChainAssetsList, // an array of assets
    placeholder: PropTypes.string, // a translation key for the placeholder text to be displayed when there is no preselected value
    // defaults to "utility.asset_select_placeholder"
    label: PropTypes.string, // translation key for the label
    style: PropTypes.object, // container div style
    formItemStyle: PropTypes.object, // Form.Item component style (used only if a label is passed)
    selectStyle: PropTypes.object // Select style

    // all other props are passed to the Select component
};

const AssetSelect = BindToChainState(AssetSelectView);

export default AssetSelect;
