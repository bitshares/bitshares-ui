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
import {connect} from "alt-react";
import SettingsStore from "../../stores/SettingsStore";
import {checkFeeStatusAsync} from "common/trxHelper";

class FeeAssetSelector extends DecimalChecker {
    constructor(props) {
        super(props);

        this.state = {
            assets: [],
            fee_amount: 0,
            fee_asset_id:
                ChainStore.assets_by_symbol.get(
                    props.settings.get("fee_asset")
                ) || "1.3.0",
            fees: {},
            feeStatus: {},
            isModalVisible: false,
            error: null
        };
        this._updateFee = debounce(this._updateFee.bind(this), 250);
        this._getFees = debounce(this._getFees.bind(this), 500);
    }

    async _getFees(assets, account, trxInfo) {
        const accountID = account.get("id");
        let result = this.state.fees;
        for (let asset_id of assets) {
            const {fee} = await checkFeeStatusAsync({
                ...trxInfo,
                accountID,
                feeID: asset_id
            });
            result[asset_id] = fee.getAmount({real: true});
        }
        this.setState({result});
    }

    _updateFee(asset_id, trxInfo, onChange) {
        // Original asset id should be passed to child component along with from_account
        let {account} = this.props;
        if (!account) return null;

        let feeID = asset_id || this.state.fee_asset_id;
        this._getFees(this.state.assets, account, trxInfo);
        checkFeeStatusAsync({
            ...trxInfo,
            accountID: account.get("id"),
            feeID
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
            .catch(err => console.warn(`Failed to check fee status: ${err}`));
    }

    componentWillReceiveProps(np, ns) {
        const {fee_amount, fee_asset_id} = this.state;
        const trxInfoChanged = !utils.are_equal_shallow(
            np.trxInfo,
            this.props.trxInfo
        );
        const account_changed =
            np.account &&
            this.props.account &&
            np.account.get("id") !== this.props.account.get("id");
        const needsFeeCalculation =
            trxInfoChanged || !fee_amount || account_changed;
        if (needsFeeCalculation) {
            this._updateFee(fee_asset_id, np.trxInfo, np.onChange);
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
        this._updateFee(account, this.props.trxInfo, this.props.onChange);
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
        this._updateFee(
            selected_asset,
            this.props.trxInfo,
            this.props.onChange
        );
    }

    render() {
        const currentAsset = this._getAsset();
        const assets =
            this.state.assets.length > 0
                ? this.state.assets
                : [currentAsset.get("id") || "1.3.0"];

        let value = this.state.error
            ? counterpart.translate("transfer.errors.insufficient")
            : this.formatAmount(this.state.fee_amount);

        const label = this.props.label ? (
            <div className="amount-selector-field--label">
                {counterpart.translate(this.props.label)}
            </div>
        ) : null;

        const canChangeFeeParams =
            !this.props.selectDisabled && this.props.account;

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
                                width: "calc(100% - 130px)"
                            }}
                            disabled={true}
                            value={value || ""}
                            tabIndex={this.props.tabIndex}
                        />

                        <AssetSelect
                            style={{width: "130px"}}
                            selectStyle={{width: "100%"}}
                            value={currentAsset.get("symbol")}
                            assets={
                                canChangeFeeParams ? Immutable.List(assets) : []
                            }
                            onChange={this.onAssetChange.bind(this)}
                            disabled={!canChangeFeeParams}
                        />
                    </Input.Group>
                </Form.Item>

                <Button
                    type="secondary"
                    onClick={this.openSetDefaultAssetModal.bind(this)}
                    style={{float: "right", height: "25px"}}
                    disabled={!canChangeFeeParams}
                >
                    {counterpart.translate("settings.change_default_fee_asset")}
                </Button>
                <SetDefaultFeeAssetModal
                    className="modal"
                    show={this.state.isModalVisible}
                    currentAccount={this.props.account}
                    asset_types={this.state.assets.map((asset, i) => ({
                        asset,
                        fee: this.state.fees[asset]
                    }))}
                    displayFees={true}
                    forceDefault={false}
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

FeeAssetSelector.propTypes = {
    // a translation key for the input label
    label: PropTypes.string,
    // account which pays fee
    account: PropTypes.any,
    // handler for changed Fee (asset, or amount)
    onChange: PropTypes.func,
    tabIndex: PropTypes.number,
    selectDisabled: PropTypes.bool,
    settings: PropTypes.any,
    // Object wih data required for fee calculation
    trxInfo: PropTypes.any
};

FeeAssetSelector.defaultProps = {
    disabled: true,
    tabIndex: 0,
    selectDisabled: true,
    label: "transfer.fee",
    account: null,
    trxInfo: {
        type: "transfer",
        options: null,
        data: {}
    }
};

FeeAssetSelector = AssetWrapper(FeeAssetSelector);

export default connect(
    FeeAssetSelector,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps(props) {
            return {
                settings: SettingsStore.getState().settings
            };
        }
    }
);
