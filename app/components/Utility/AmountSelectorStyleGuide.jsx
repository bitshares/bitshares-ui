import utils from "common/utils";
import React from "react";
import Immutable from "immutable";
import counterpart from "counterpart";
import AssetWrapper from "./AssetWrapper";
import PropTypes from "prop-types";
import {DecimalChecker} from "./DecimalChecker";
import {Form, Input, Select} from "bitshares-ui-style-guide";

class AssetSelector extends React.Component {
    static propTypes = {
        value: PropTypes.string, // asset id
        onChange: PropTypes.func,
        scroll_length: PropTypes.number
    };

    shouldComponentUpdate(np) {
        return (
            !utils.are_equal_shallow(np.assets, this.props.assets) ||
            np.value !== this.props.value ||
            np.scroll_length !== this.props.scroll_length
        );
    }

    render() {
        if (!this.props.assets.length) return null;

        return (
            <Select
                showSearch
                style={this.props.style || {}}
                value={this.props.value}
                onChange={this.props.onChange}
            >
                {this.props.assets
                    .filter(asset => asset && asset.get)
                    .map(asset => {
                        return (
                            <Select.Option key={asset.get("symbol")}>
                                {asset.get("symbol")}
                            </Select.Option>
                        );
                    })}
            </Select>
        );
    }
}

AssetSelector = AssetWrapper(AssetSelector, {asList: true});

class AmountSelector extends DecimalChecker {
    static propTypes = {
        label: PropTypes.string, // a translation key for the label
        assets: PropTypes.array,
        amount: PropTypes.any,
        placeholder: PropTypes.string,
        onChange: PropTypes.func,
        tabIndex: PropTypes.number,
        error: PropTypes.string,
        scroll_length: PropTypes.number
    };

    static defaultProps = {
        disabled: false,
        tabIndex: 0
    };

    componentDidMount() {
        this.onAssetChange(this.props.asset);
    }

    formatAmount(v) {
        /*// TODO: use asset's precision to format the number*/
        if (!v) v = "";
        if (typeof v === "number") v = v.toString();
        let value = v.trim().replace(/,/g, "");

        return value;
    }

    _onChange(e) {
        if (this.props.onChange)
            this.props.onChange({
                amount: this.getNumericEventValue(e),
                asset: this.props.asset
            });
    }

    onAssetChange(selected_asset) {
        if (this.props.onChange)
            this.props.onChange({
                amount: this.props.amount,
                asset: selected_asset
            });
    }

    render() {
        let value = this.props.error
            ? counterpart.translate(this.props.error)
            : this.formatAmount(this.props.amount);

        const label = (
            <div className="amount-selector-field--label">
                {counterpart.translate(this.props.label).toUpperCase()}:
                <div className="amount-selector-field--balance">
                    {this.props.display_balance}
                </div>
            </div>
        );

        let addonAfter = null;

        if (this.props.isPrice) {
            addonAfter = (
                <div>
                    {this.props.asset.get("symbol")}/{this.props.base}
                </div>
            );
        }

        return (
            <Form.Item
                label={label}
                style={this.props.style}
                className="amount-selector-field"
            >
                <Input.Group compact>
                    <Input
                        style={{
                            width: this.props.isPrice
                                ? "100%"
                                : "calc(100% - 130px)"
                        }}
                        disabled={this.props.disabled}
                        value={value || ""}
                        placeholder={this.props.placeholder}
                        onChange={this._onChange.bind(this)}
                        tabIndex={this.props.tabIndex}
                        onPaste={this.props.onPaste || this.onPaste.bind(this)}
                        onKeyPress={this.onKeyPress.bind(this)}
                        addonAfter={addonAfter}
                    />

                    {!this.props.isPrice ? (
                        <AssetSelector
                            style={{width: "130px"}}
                            value={this.props.asset.get("symbol")}
                            assets={Immutable.List(this.props.assets)}
                            onChange={this.onAssetChange.bind(this)}
                        />
                    ) : null}
                </Input.Group>
            </Form.Item>
        );
    }
}
AmountSelector = AssetWrapper(AmountSelector);

export default AmountSelector;
