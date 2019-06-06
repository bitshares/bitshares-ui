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
import {debounce} from "lodash-es";
import {
    checkFeeStatusAsync,
    shouldPayFeeWithAssetAsync
} from "common/trxHelper";

// TODO remove duplicated logic against amount selector
class FeeAssetSelector extends DecimalChecker {
    static propTypes = {
        label: PropTypes.string, // a translation key for the label
        main_asset_id: PropTypes.string,
        memo: PropTypes.string,
        account: PropTypes.any,
        placeholder: PropTypes.string,
        onChange: PropTypes.func,
        tabIndex: PropTypes.number,
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
            assets: [],
            fee_amount: 0,
            fee_asset_id: "1.3.0",
            fees: {},
            feeStatus: {},
            isModalVisible: false,
            error: null
        };
        this._updateFee = debounce(this._updateFee.bind(this), 250);
        this._getFees = debounce(this._getFees.bind(this), 500);
    }

    async _getFees(assets, account, data) {
        const accountID = account.get("id");
        let result = this.state.fees;
        for (let asset_id of assets) {
            const {fee} = await checkFeeStatusAsync({
                accountID,
                feeID: asset_id,
                options: ["price_per_kbyte"],
                data
            });
            result[asset_id] = fee.getAmount({real: true});
        }
        this.setState({result});
    }

    _updateFee(asset_id, memo, onChange) {
        // Original asset id should be passed to child component along with from_account
        let {account} = this.props;
        if (!account) return null;

        let feeID = asset_id || this.state.fee_asset_id;
        const trxData = {
            type: "memo",
            content: memo
        };
        this._getFees(this.state.assets, account, trxData);
        checkFeeStatusAsync({
            accountID: account.get("id"),
            feeID,
            options: ["price_per_kbyte"],
            data: trxData
        })
            .then(({fee, hasPoolBalance}) => {
                this.setState({
                    fee_amount: fee.getAmount({real: true}),
                    fee_asset_id: fee.asset_id,
                    error: !hasPoolBalance
                });
                if (onChange) {
                    onChange(fee);
                }
                this.setState({
                    assets: this._getAvailableAssets(account),
                    fee_amount: fee.getAmount({real: true}),
                    fee_asset_id: fee.asset_id
                });
            })
            .catch(err => console.error(err));
    }

    componentWillReceiveProps(np, ns) {
        const {fee_amount, fee_asset_id} = this.state;
        const memo_changed = np.memo !== this.props.memo;
        const account_changed =
            np.account.get("id") !== this.props.account.get("id");
        const needsFeeCalculation =
            memo_changed || !fee_amount || account_changed;
        if (needsFeeCalculation) {
            this._updateFee(fee_asset_id, np.memo, np.onChange);
        }
    }

    _getAsset() {
        const {assets, fee_asset_id} = this.state;
        return ChainStore.getAsset(
            fee_asset_id
                ? fee_asset_id
                : assets.length === 1
                    ? assets[0]
                    : "1.3.0"
        );
    }

    _getAvailableAssets(account) {
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
        fee_asset_types = fee_asset_types.filter(a => {
            return hasFeePoolBalance(a) && hasBalance(a);
        });*/

        this.setState({balances: account_balances, assets: fee_asset_types});
        this._updateFee(account, this.props.memo, this.props.onChange);
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

    onAssetChange(selected_asset) {
        this._updateFee(selected_asset, this.props.memo, this.props.onChange);
    }

    render() {
        let value = this.state.error
            ? counterpart.translate("transfer.errors.insufficient")
            : this.formatAmount(this.state.fee_amount);

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
        const assets =
            this.state.assets.length > 0
                ? this.state.assets
                : [this._getAsset().get("id") || "1.3.0"];
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
                                assets={Immutable.List(assets)}
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
                    account={this.props.account}
                    asset_types={this.state.assets.map((asset, i) => ({
                        asset,
                        fee: this.state.fees[asset]
                    }))}
                    current_asset={this.state.fee_asset_id}
                    onChange={this.onAssetChange.bind(this)}
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
