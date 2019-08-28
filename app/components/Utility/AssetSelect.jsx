import React from "react";
import Translate from "react-translate-component";
import PropTypes from "prop-types";
import {Form, Select} from "bitshares-ui-style-guide";
import utils from "common/utils";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {Map} from "immutable";
import AssetName from "../Utility/AssetName";
import LoadingIndicator from "../LoadingIndicator";

const AssetSelectView = ({
    label,
    assets,
    selectStyle,
    formItemStyle,
    style,
    placeholder,
    value,
    onDropdownVisibleChange,
    ...props
}) => {
    const disableSelect =
        assets.filter(Map.isMap).length <= 1 && !onDropdownVisibleChange;
    // if onDropdownVisibleChange given we assume that lazy loading takes place
    const select = (
        <Select
            showSearch
            onDropdownVisibleChange={onDropdownVisibleChange}
            showArrow={disableSelect ? false : undefined}
            style={selectStyle}
            placeholder={
                <Translate
                    content={placeholder || "utility.asset_select_placeholder"}
                />
            }
            value={value}
            {...props}
            optionFilterProp="children"
            filterOption={(input, option) =>
                option.key.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled={disableSelect}
            notFoundContent={counterpart.translate("global.not_found")}
        >
            {assets.filter(Map.isMap).map(asset => {
                const {name: replacedName, prefix} = utils.replaceName(asset);

                return (
                    <Select.Option
                        key={`${prefix || ""}${replacedName}`}
                        value={asset.get("id")}
                    >
                        <AssetName noTip name={asset.get("symbol")} />
                    </Select.Option>
                );
            })}
            {props.loading && (
                <Select.Option key="loading" value="loading" disabled={true}>
                    <LoadingIndicator type="three-bounce" />
                </Select.Option>
            )}
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

AssetSelectView.defaultPropTypes = {
    assets: [],
    placeholder: null,
    label: null,
    style: "",
    formItemStyle: "",
    selectStyle: ""
};

const AssetSelect = BindToChainState(AssetSelectView);

export default AssetSelect;
