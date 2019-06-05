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
        account: PropTypes.any,
        feeAmount: PropTypes.any,
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
            assets: [],
            feeAsset: null,
            fee_asset_id: "1.3.0",
            feeAmount: new Asset({amount: 0}),
            feeStatus: {},
            isModalVisible: false
        };
    }

    componentWillReceiveProps(np) {
        console.log(np.amount);
        console.log(np.feeAmount);
        this.setState({
            assets: this._getAvailableAssets(np.account),
            fee_asset_id: np.feeAmount
                ? np.feeAmount.asset_id
                : this.props.feeAmount.asset_id
        });
    }

    _getAsset() {
        const {assets, fee_asset_id} = this.state;
        return ChainStore.getAsset(
            assets.length && this.props.feeAmount
                ? this.props.feeAmount.asset_id
                : assets.length === 1
                    ? assets[0]
                    : fee_asset_id
                        ? fee_asset_id
                        : assets[0]
        );
    }

    _getAvailableAssets(account) {
        /* TODO uncomment when it comes to feeStatus
        const {feeStatus} = this.state;
        function hasFeePoolBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasPoolBalance;
        }

        function hasBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasBalance;
        }
        */

        let fee_asset_types = [];
        if (!(account && account.get("balances"))) {
            return fee_asset_types;
        }
        const account_balances = account.get("balances").toJS();
        fee_asset_types = Object.keys(account_balances).sort(utils.sortID);
        for (let key in account_balances) {
            let balanceObject = ChainStore.getObject(account_balances[key]);
            if (balanceObject && balanceObject.get("balance") === 0) {
                if (fee_asset_types.includes(key)) {
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                }
            }
        }

        /*fee_asset_types = fee_asset_types.filter(a => {
            return hasFeePoolBalance(a) && hasBalance(a);
        });*/

        return fee_asset_types;
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
        console.log(e);
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
                                assets={Immutable.List(this.state.assets)}
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
                    asset_types={this.state.assets}
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
