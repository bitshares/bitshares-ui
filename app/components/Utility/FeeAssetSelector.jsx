import utils from "common/utils";
import React from "react";
import Immutable from "immutable";
import counterpart from "counterpart";
import AssetWrapper from "./AssetWrapper";
import PropTypes from "prop-types";
import {DecimalChecker} from "./DecimalChecker";
import {Form, Input, Button, Tooltip} from "bitshares-ui-style-guide";
import AssetSelect from "./AssetSelect";
import {ChainStore} from "bitsharesjs";
import SetDefaultFeeAssetModal from "../Modal/SetDefaultFeeAssetModal";
import {debounce} from "lodash-es";
import {connect} from "alt-react";
import SettingsStore from "../../stores/SettingsStore";
import {checkFeeStatusAsync} from "common/trxHelper";

class FeeAssetSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            asset: null,
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
        this.setState({fees: result});
    }

    shouldComponentUpdate(np, ns) {
        return (
            ns.fee_amount !== this.state.fee_amount ||
            ns.fee_asset_id !== this.state.fee_asset_id
        );
    }

    _updateFee(asset_id, trxInfo, onChange) {
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
            .catch(err => {
                console.warn(err);
            });
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
        const {assets, fee_asset_id, asset} = this.state;
        if (!asset || fee_asset_id !== asset.get("id")) {
            const selectedAsset = ChainStore.getAsset(
                fee_asset_id
                    ? fee_asset_id
                    : assets.length === 1
                        ? assets[0]
                        : "1.3.0"
            );
            this.setState({asset: selectedAsset});
            return selectedAsset;
        }
        return asset;
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

        this.setState({balances: account_balances, assets: fee_asset_types});
        this._updateFee(account, this.props.trxInfo, this.props.onChange);
        return fee_asset_types;
    }

    componentDidMount() {
        this.onAssetChange(this.state.fee_asset_id);
    }

    onAssetChange(selected_asset) {
        this.setState({fee_asset_id: selected_asset});
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
            : this.state.fee_amount;

        const label = this.props.label ? (
            <div className="amount-selector-field--label">
                {counterpart.translate(this.props.label)}
            </div>
        ) : null;

        const canChangeFeeParams =
            !this.props.selectDisabled && this.props.account;

        const changeDefaultButton = (
            <Tooltip
                title={counterpart.translate(
                    "settings.change_default_fee_asset_tooltip"
                )}
            >
                <Button
                    type="secondary"
                    style={{right: "-12px"}}
                    onClick={this.openSetDefaultAssetModal.bind(this)}
                    disabled={!canChangeFeeParams}
                >
                    {counterpart.translate("settings.change_default")}
                </Button>
            </Tooltip>
        );

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
                            suffix={
                                this.state.error
                                    ? changeDefaultButton
                                    : undefined
                            }
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
    selectDisabled: false,
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
