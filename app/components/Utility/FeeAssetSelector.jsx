import utils from "common/utils";
import React from "react";
import Immutable from "immutable";
import counterpart from "counterpart";
import AssetWrapper from "./AssetWrapper";
import PropTypes from "prop-types";
import {Form, Input, Button, Tooltip, Icon} from "bitshares-ui-style-guide";
import AssetSelect from "./AssetSelect";
import {FetchChain} from "bitsharesjs";
import SetDefaultFeeAssetModal from "../Modal/SetDefaultFeeAssetModal";
import debounceRender from "react-debounce-render";
import {connect} from "alt-react";
import SettingsStore from "../../stores/SettingsStore";
import {checkFeeStatusAsync} from "common/trxHelper";

const DEBUG = __DEV__ && false;

class FeeAssetSelector extends React.Component {
    static propTypes = {
        // injected
        defaultFeeAsset: PropTypes.any,

        // object wih data required for fee calculation
        transaction: PropTypes.any,

        // assets to choose from
        assets: PropTypes.any,

        // a translation key for the input label, defaults to "Fee"
        label: PropTypes.string,

        // handler for changedFee (asset, or amount)
        onChange: PropTypes.func,

        // account which pays fee
        account: PropTypes.any,

        // tab index if needed
        tabIndex: PropTypes.number,

        // do not allow to switch the asset or amount
        disabled: PropTypes.bool
    };

    static defaultProps = {
        label: "transfer.fee",
        disabled: false
    };

    constructor(props) {
        super(props);

        this.state = {
            feeAsset: props.defaultFeeAsset,

            calculatedFeeAmount: null,

            assets: null,
            assetsLoading: false,

            isModalVisible: false,
            error: null
        };
    }

    async _calculateFee(asset = null) {
        const {account, transaction} = this.props;
        const setState = asset == null;
        if (!asset) {
            asset = this.state.feeAsset;
        }
        const feeID = typeof asset == "string" ? asset : asset.get("id");
        try {
            const {fee, hasPoolBalance} = await checkFeeStatusAsync({
                ...transaction,
                accountID: account.get("id"),
                feeID
            });

            if (setState) {
                this.setState(
                    {
                        calculatedFeeAmount: fee.getAmount({real: true}),
                        error: !hasPoolBalance
                            ? {
                                  key: "noPoolBalanceShort",
                                  tooltip: "noPoolBalance"
                              }
                            : false
                    },
                    () => {
                        if (this.props.onChange) {
                            this.props.onChange(fee);
                        }
                    }
                );
            }
            return {
                fee,
                hasPoolBalance
            };
        } catch (err) {
            if (setState) {
                this.setState({
                    calculatedFeeAmount: 0,
                    error: {
                        key: "unknown"
                    }
                });
            }
            console.error(err);
            throw err;
        }
    }

    _accountChanges(oldProps, newProps) {
        return (
            newProps.account &&
            (!oldProps.account ||
                newProps.account.get("id") !== oldProps.account.get("id"))
        );
    }

    _feeNeedCalculation(oldProps, newProps, oldState, newState) {
        const accountChanged = this._accountChanges(oldProps, newProps);
        const transactionChanged =
            newProps.transaction &&
            JSON.stringify(newProps.transaction) !==
                JSON.stringify(oldProps.transaction);
        const feeAssetChanged =
            newState.feeAsset &&
            (!oldState.feeAsset ||
                newState.feeAsset.get("id") !== oldState.feeAsset.get("id"));
        let calculationIsPossible =
            newProps.account && newProps.transaction && newState.feeAsset;
        return (
            calculationIsPossible &&
            (accountChanged || transactionChanged || feeAssetChanged)
        );
    }

    shouldComponentUpdate(np, ns) {
        if (DEBUG)
            console.log(
                "FeeAssetSelector.shouldComponentUpdate",
                this.props,
                np
            );
        if (ns.assets) {
            if (!this.state.assets) {
                return true;
            }
            if (ns.assets.length !== this.state.assets.length) {
                return true;
            }
        }
        return (
            this._feeNeedCalculation(this.props, np, this.state, ns) ||
            ns.calculatedFeeAmount !== this.state.calculatedFeeAmount ||
            ns.assetsLoading !== this.state.assetsLoading ||
            ns.isModalVisible !== this.state.isModalVisible ||
            ns.error !== this.state.error
        );
    }

    _getAsset() {
        const {assets, feeAsset} = this.state;
        return feeAsset
            ? feeAsset
            : assets && assets.length > 0
                ? assets[0]
                : null;
    }

    _getSelectableAssets() {
        return this.state.assets
            ? this.state.assets
            : [this._getAsset().get("symbol")];
    }

    async _syncAvailableAssets(opened, account = this.props.account) {
        if (DEBUG)
            console.log(
                "FeeAssetSelector.syncAvailableAssets",
                opened,
                account
            );
        if (this.state.assets) {
            return this.state.assets;
        }
        this.setState({
            assetsLoading: true
        });
        let possibleAssets = [this._getAsset().get("id")];
        const accountBalances = account.get("balances").toJS();
        const sortedKeys = Object.keys(accountBalances).sort(utils.sortID);
        for (let i = 0, key; (key = sortedKeys[i]); i++) {
            const balanceObject = await FetchChain(
                "getObject",
                accountBalances[key]
            );
            try {
                const requiredForFee = await this._calculateFee(key);
                if (DEBUG) {
                    console.log(
                        "FeeAssetSelector.syncAvailableAssets: Checking " +
                            key +
                            " ... ",
                        requiredForFee
                    );
                }
                if (
                    balanceObject &&
                    balanceObject.get("balance") >=
                        requiredForFee.fee.getAmount() &&
                    !possibleAssets.includes(key)
                ) {
                    possibleAssets.push(key);
                    possibleAssets = possibleAssets.sort(utils.sortID);
                    this.setState({
                        assets: possibleAssets
                    });
                }
            } catch (err) {
                if (DEBUG) {
                    console.log(" ... not possible");
                }
            }
        }

        this.setState({
            assetsLoading: false
        });
    }

    componentDidMount() {
        if (this._feeNeedCalculation({}, this.props, {}, this.state)) {
            this._calculateFee();
        }
        if (DEBUG) {
            console.log("FeeAssetSelector.componentDidMount", this.props);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (DEBUG) {
            console.log(
                "FeeAssetSelector.componentDidUpdate",
                prevProps,
                this.props
            );
        }
        if (this._accountChanges(prevProps, this.props)) {
            this.setState({assets: null});
        }
        if (
            this._feeNeedCalculation(
                prevProps,
                this.props,
                prevState,
                this.state
            )
        ) {
            this._calculateFee();
        }
    }

    componentWillReceiveProps(np, ns) {
        // don't do async loading in componentWillReceiveProps
    }

    async onAssetChange(selectedAssetId) {
        const asset = await FetchChain("getAsset", selectedAssetId);
        this.setState(
            {
                feeAsset: asset
            },
            this._calculateFee.bind(this)
        );
    }

    render() {
        const currentAsset = this._getAsset();
        // noPoolBalanceShort
        let feeInputString = this.state.error
            ? counterpart.translate("transfer.errors." + this.state.error.key)
            : this.state.calculatedFeeAmount;

        const label = this.props.label ? (
            <div className="amount-selector-field--label">
                {counterpart.translate(this.props.label)}
                {this.state.error &&
                    this.state.error.tooltip && (
                        <Tooltip
                            title={counterpart.translate(
                                "transfer.errors." + this.state.error.tooltip
                            )}
                        >
                            &nbsp; <Icon type="question-circle" />
                        </Tooltip>
                    )}
            </div>
        ) : null;

        const canChangeFeeParams = !this.props.disabled && !!this.props.account;

        const changeDefaultButton = (
            <Tooltip
                title={counterpart.translate(
                    "settings.change_default_fee_asset_tooltip"
                )}
                mouseEnterDelay={0.5}
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

        const selectableAssets = this._getSelectableAssets();

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
                            value={feeInputString || ""}
                            tabIndex={this.props.tabIndex}
                            suffix={
                                this.state.error
                                    ? changeDefaultButton
                                    : undefined
                            }
                        />

                        <AssetSelect
                            loading={this.state.assetsLoading}
                            onDropdownVisibleChange={this._syncAvailableAssets.bind(
                                this
                            )}
                            style={{width: "130px"}}
                            selectStyle={{width: "100%"}}
                            value={currentAsset.get("symbol")}
                            assets={
                                canChangeFeeParams
                                    ? Immutable.List(selectableAssets)
                                    : []
                            }
                            onChange={this.onAssetChange.bind(this)}
                        />
                    </Input.Group>
                </Form.Item>

                {this.state.isModalVisible && (
                    <SetDefaultFeeAssetModal
                        className="modal"
                        show={this.state.isModalVisible}
                        currentAccount={this.props.account}
                        asset_types={
                            undefined //this.state.assets.map(asset => ({
                            //asset,
                            //fee: this.state.fees[asset]
                            //}))
                        }
                        displayFees={true}
                        forceDefault={false}
                        current_asset={currentAsset.get("id")}
                        onChange={this.onAssetChange.bind(this)}
                        close={() => {
                            this.setState({isModalVisible: false});
                        }}
                    />
                )}
            </div>
        );
    }

    openSetDefaultAssetModal() {
        this.setState({isModalVisible: true});
    }
}

FeeAssetSelector = debounceRender(FeeAssetSelector, 150, {
    leading: false
});

FeeAssetSelector = AssetWrapper(FeeAssetSelector, {
    propNames: ["defaultFeeAsset"]
});

export default connect(
    FeeAssetSelector,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                defaultFeeAsset:
                    SettingsStore.getState().settings.get("fee_asset") ||
                    "1.3.0"
            };
        }
    }
);
