import utils from "common/utils";
import React from "react";
import Immutable from "immutable";
import counterpart from "counterpart";
import AssetWrapper from "./AssetWrapper";
import PropTypes from "prop-types";
import {DecimalChecker} from "./DecimalChecker";
import {Form, Input, Button} from "bitshares-ui-style-guide";
import AssetSelect from "./AssetSelect";
import {ChainStore} from "bitsharesjs";
import SetDefaultFeeAssetModal from "../Modal/SetDefaultFeeAssetModal";
import {Asset} from "common/MarketClasses";

// TODO remove duplicated logic against amount selector
class FeeAssetSelector extends DecimalChecker {
    static propTypes = {
        label: PropTypes.string, // a translation key for the label
        assets: PropTypes.array,
        feeAmount: PropTypes.any,
        fee_asset_id: PropTypes.any,
        amount: PropTypes.any,
        placeholder: PropTypes.string,
        onChange: PropTypes.func,
        tabIndex: PropTypes.number,
        error: PropTypes.string,
        scroll_length: PropTypes.number,
        selectDisabled: PropTypes.bool
    };

    static defaultProps = {
        disabled: false,
        tabIndex: 0,
        selectDisabled: false
    };

    constructor(props) {
        super(props);
        this.state = {
            asset: null,
            feeAsset: null,
            fee_asset_id: "1.3.0",
            feeAmount: new Asset({amount: 0}),
            feeStatus: {},
            isModalVisible: false
        };
    }

    _getAsset() {
        return ChainStore.getAsset(
            this.props.assets.length && this.props.feeAmount
                ? this.props.feeAmount.asset_id
                : this.props.assets.length === 1
                    ? this.props.assets[0]
                    : this.props.fee_asset_id
                        ? this.props.fee_asset_id
                        : this.props.assets[0]
        );
    }

    componentDidMount() {
        this.onAssetChange(this._getAsset());
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
                asset: this._getAsset()
            });
    }

    onAssetChange(selected_asset) {
        if (this.props.onChange) {
            this.props.onChange({
                amount: this.props.amount,
                asset: selected_asset
            });
        }
    }

    render() {
        console.log(this._getAsset());
        let value = this.props.error
            ? counterpart.translate(this.props.error)
            : this.formatAmount(this.props.amount);

        const label = this.props.label ? (
            <div className="amount-selector-field--label">
                {counterpart.translate(this.props.label)}
                <div className="amount-selector-field--balance">
                    {this.props.display_balance}
                </div>
            </div>
        ) : null;

        let addonAfter = null;

        /*if (this.props.isPrice) {
            addonAfter = (
                <div>
                    {this._getAsset().get("symbol")}/{this.props.base}
                </div>
            );
        }*/

        return (
            <div>
                <Form.Item
                    label={label}
                    style={{...this.props.style, margin: "0 0 0 0"}}
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
                            onPaste={
                                this.props.onPaste || this.onPaste.bind(this)
                            }
                            onKeyPress={this.onKeyPress.bind(this)}
                            /*addonAfter={addonAfter}*/
                        />

                        {!this.props.isPrice ? (
                            <AssetSelect
                                style={{width: "130px"}}
                                selectStyle={{width: "100%"}}
                                value={this._getAsset().get("symbol")}
                                assets={Immutable.List(this.props.assets)}
                                onChange={this.onAssetChange.bind(this)}
                                disabled={
                                    this.props.selectDisabled ? true : undefined
                                }
                            />
                        ) : null}
                    </Input.Group>
                </Form.Item>

                <Button
                    type="secondary"
                    onClick={this.openSetDefaultAssetModal.bind(this)}
                    style={{float: "right", height: "25px"}}
                >
                    Select another asset
                </Button>
                <SetDefaultFeeAssetModal
                    className="modal"
                    show={this.state.isModalVisible}
                    fee_asset_types={this.props.assets}
                    asset_types={this.props.assets}
                    close={() => {
                        this.setState({isModalVisible: false});
                    }}
                />
            </div>
        );
    }

    openSetDefaultAssetModal() {
        this.setState({isModalVisible: true});
    }
}
FeeAssetSelector = AssetWrapper(FeeAssetSelector);

export default FeeAssetSelector;
