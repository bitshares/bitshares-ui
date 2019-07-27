import React from "react";
import Translate from "react-translate-component";
import {ChainStore} from "bitsharesjs";
import AmountSelector from "../Utility/AmountSelector";
import PeriodSelector from "../Utility/PeriodSelector";
import FeeAssetSelector from "components/Utility/FeeAssetSelector";

import AccountStore from "stores/AccountStore";
import AccountSelector from "../Account/AccountSelector";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import {Asset} from "common/MarketClasses";
import {isNaN} from "lodash-es";
import {checkBalance} from "common/trxHelper";
import BalanceComponent from "../Utility/BalanceComponent";
import utils from "common/utils";
import counterpart from "counterpart";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import {Modal, Button, Tooltip, Form} from "bitshares-ui-style-guide";
import {DatePicker} from "antd";
import ApplicationApi from "../../api/ApplicationApi";
import moment from "moment";

class DirectDebitModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
        this._checkBalance = this._checkBalance.bind(this);
        this._isMounted = false;
    }

    getInitialState() {
        return {
            to_name: "",
            from_account: null,
            to_account: null,
            amount: "",
            asset_id: null,
            asset: null,
            error: null,
            fee_asset_id:
                ChainStore.assets_by_symbol.get(this.props.fee_asset_symbol) ||
                "1.3.0",
            feeAmount: new Asset({amount: 0}),
            feeStatus: {},
            maxAmount: false,
            num_of_periods: "",
            period: {amount: "", type: {seconds: 604800, name: "Week"}},
            period_start_time: moment().add("seconds", 120),
            permissionId: "",
            balanceError: false
        };
    }

    onSubmit = e => {
        e.preventDefault();
        let {
            from_account,
            to_account,
            amount,
            asset,
            asset_id,
            fee_asset_id,
            period,
            num_of_periods,
            period_start_time,
            permissionId
        } = this.state;
        const {
            operation: {type: operationType}
        } = this.props;

        if (operationType === "create") {
            ApplicationApi.createWithdrawPermission(
                from_account,
                to_account,
                asset_id,
                utils.convert_typed_to_satoshi(amount, asset),
                period.type.seconds * Number(period.amount),
                num_of_periods,
                period_start_time.valueOf(),
                fee_asset_id
            )
                .then(result => {
                    this.props.hideModal();
                })
                .catch(err => {
                    // todo: visualize error somewhere
                    console.error(err);
                });
        } else if (operationType === "update") {
            ApplicationApi.updateWithdrawPermission(
                permissionId,
                from_account,
                to_account,
                asset_id,
                utils.convert_typed_to_satoshi(amount, asset),
                period.type.seconds * Number(period.amount),
                num_of_periods,
                period_start_time.valueOf(),
                feeAsset
            )
                .then(result => {
                    this.props.hideModal();
                })
                .catch(err => {
                    // todo: visualize error somewhere
                    console.error(err);
                });
        }
    };

    componentDidMount() {
        this._isMounted = true;
    }

    componentDidUpdate(prevProps, prevState) {
        const {operation} = this.props;
        if (
            this.props.isModalVisible &&
            prevProps.isModalVisible !== this.props.isModalVisible
        ) {
            this.setState({
                from_account: ChainStore.getAccount(this.props.currentAccount)
            });
        } else if (
            !this.props.isModalVisible &&
            prevProps.isModalVisible !== this.props.isModalVisible
        ) {
            this.setState(this.getInitialState()); // reset state
        }

        // Update operation
        if (
            operation &&
            operation.type === "update" &&
            operation.payload.id !== prevState.permissionId
        ) {
            const toAccount = ChainStore.getAccount(
                operation.payload.authorized_account
            );

            if (toAccount && toAccount.get) {
                const timeStart = moment
                    .utc(operation.payload.period_start_time)
                    .valueOf();
                const timeEnd = moment
                    .utc(operation.payload.expiration)
                    .valueOf();
                const numberOfPeriods =
                    (timeEnd - timeStart) /
                    (operation.payload.withdrawal_period_sec * 1000);

                const periodTypes = [
                    {seconds: 604800, name: "Week"},
                    {seconds: 86400, name: "Day"},
                    {seconds: 3600, name: "Hour"},
                    {seconds: 60, name: "Minute"}
                ];

                let periodSecs, periodName, periodAmount;

                for (let i = 0; i < periodTypes.length; i++) {
                    if (
                        operation.payload.withdrawal_period_sec >=
                        periodTypes[i].seconds
                    ) {
                        let currentPeriod = periodTypes[i];

                        periodName = currentPeriod.name;
                        periodSecs = currentPeriod.seconds;
                        periodAmount = Math.round(
                            operation.payload.withdrawal_period_sec /
                                currentPeriod.seconds
                        );
                        break;
                    }
                }
                let asset = ChainStore.getAsset(
                    operation.payload.withdrawal_limit.asset_id
                );
                this.setState({
                    to_account: toAccount,
                    to_name: toAccount.get("name"),
                    asset: asset,
                    permissionId: operation.payload.id,
                    amount: utils.convert_satoshi_to_typed(
                        operation.payload.withdrawal_limit.amount,
                        asset
                    ),
                    asset_id: operation.payload.withdrawal_limit.asset_id,
                    num_of_periods: numberOfPeriods,
                    period: {
                        amount: periodAmount,
                        type: {
                            seconds: periodSecs,
                            name: periodName
                        }
                    },
                    period_start_time: moment.utc(
                        operation.payload.period_start_time
                    )
                });
            }
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    _checkBalance() {
        const {feeAmount, amount, from_account, asset} = this.state;
        if (!asset || !from_account) return;
        const balanceID = from_account.getIn(["balances", asset.get("id")]);
        const feeBalanceID = from_account.getIn([
            "balances",
            feeAmount.asset_id
        ]);
        if (!asset || !from_account) return;
        if (!balanceID) return this.setState({balanceError: true});
        let balanceObject = ChainStore.getObject(balanceID);
        let feeBalanceObject = feeBalanceID
            ? ChainStore.getObject(feeBalanceID)
            : null;
        if (!feeBalanceObject || feeBalanceObject.get("balance") === 0) {
            this.setState({fee_asset_id: this.state.fee_asset_id});
        }
        if (!balanceObject || !feeAmount) return;
        if (!amount) return this.setState({balanceError: false});
        const hasBalance = checkBalance(
            amount,
            asset,
            feeAmount,
            balanceObject
        );
        if (hasBalance === null) return;
        this.setState({balanceError: !hasBalance});
    }

    _setTotal(asset_id, balance_id) {
        const {feeAmount} = this.state;
        let balanceObject = ChainStore.getObject(balance_id);
        let transferAsset = ChainStore.getObject(asset_id);

        let balance = new Asset({
            amount: balanceObject.get("balance"),
            asset_id: transferAsset.get("id"),
            precision: transferAsset.get("precision")
        });

        if (balanceObject) {
            if (feeAmount.asset_id === balance.asset_id) {
                balance.minus(feeAmount);
            }
            this.setState(
                {maxAmount: true, amount: balance.getAmount({real: true})},
                this._checkBalance
            );
        }
    }

    _getAvailableAssets(state = this.state) {
        const {from_account} = state;
        let asset_types = [],
            fee_asset_types = [];
        if (!(from_account && from_account.get("balances"))) {
            return {asset_types, fee_asset_types};
        }
        let account_balances = state.from_account.get("balances").toJS();
        asset_types = Object.keys(account_balances).sort(utils.sortID);
        fee_asset_types = Object.keys(account_balances).sort(utils.sortID);
        for (let key in account_balances) {
            let balanceObject = ChainStore.getObject(account_balances[key]);
            if (balanceObject && balanceObject.get("balance") === 0) {
                asset_types.splice(asset_types.indexOf(key), 1);
                if (fee_asset_types.indexOf(key) !== -1) {
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                }
            }
        }
        return {asset_types, fee_asset_types};
    }

    onToAccountChanged = to_account => {
        this.setState({to_account, error: null});
    };

    onAmountChanged = ({amount, asset}) => {
        if (!asset) {
            return;
        }

        this.setState(
            {
                amount,
                asset,
                asset_id: asset.get("id"),
                error: null,
                maxAmount: false
            },
            this._checkBalance
        );
    };

    toChanged = to_name => {
        this.setState({to_name, error: null});
    };

    onFeeChanged(asset) {
        this.setState({fee_asset_id: asset.asset_id, error: null});
    }

    onTrxIncluded(confirm_store_state) {
        if (
            confirm_store_state.included &&
            confirm_store_state.broadcasted_transaction
        ) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        } else if (confirm_store_state.closed) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        }
    }

    onNumOfPeriodsChanged = e => {
        let newValue = parseInt(e.target.value, 10);
        if (!isNaN(newValue) && typeof newValue === "number" && newValue >= 0) {
            this.setState({num_of_periods: newValue});
        }
    };

    onPeriodChanged = ({amount, type}) => {
        this.setState({period: {amount, type}});
    };

    onDatepickerRef(el) {
        if (el && el.picker.input) {
            el.picker.input.readOnly = false;
        }
    }

    onStartDateChanged = utcValue => {
        if (utcValue) {
            this.setState({period_start_time: utcValue});
        } else {
            this.setState({period_start_time: null});
        }
    };

    render() {
        let {
            from_account,
            to_account,
            asset,
            asset_id,
            amount,
            to_name,
            fee_asset_id,
            balanceError,
            num_of_periods,
            period,
            period_start_time
        } = this.state;

        const {operation} = this.props;

        let {asset_types} = this._getAvailableAssets();

        let balance = null;

        // Estimate fee
        let fee = this.state.feeAmount.getAmount({real: true});

        if (from_account && from_account.get("balances")) {
            let account_balances = from_account.get("balances").toJS();
            let _error = this.state.balanceError ? "has-error" : "";
            if (asset_types.length === 1)
                asset = ChainStore.getAsset(asset_types[0]);
            if (asset_types.length > 0) {
                let current_asset_id = asset ? asset.get("id") : asset_types[0];
                let feeID = fee_asset_id;

                balance = (
                    <span>
                        <Translate
                            component="span"
                            content="transfer.available"
                        />
                        :{" "}
                        <span
                            className={_error}
                            style={{
                                borderBottom: "#A09F9F 1px dotted",
                                cursor: "pointer"
                            }}
                            onClick={this._setTotal.bind(
                                this,
                                current_asset_id,
                                account_balances[current_asset_id],
                                fee,
                                feeID
                            )}
                        >
                            <BalanceComponent
                                balance={account_balances[current_asset_id]}
                            />
                        </span>
                    </span>
                );

                if (feeID == current_asset_id && this.state.balanceError) {
                    balance_fee = (
                        <span>
                            <span className={_error}>
                                <Translate content="transfer.errors.insufficient" />
                            </span>
                        </span>
                    );
                }
            } else {
                balance = (
                    <span>
                        <span className={_error}>
                            <Translate content="transfer.errors.noFunds" />
                        </span>
                    </span>
                );
                balance_fee = (
                    <span>
                        <span className={_error}>
                            <Translate content="transfer.errors.noFunds" />
                        </span>
                    </span>
                );
            }
        }

        const amountValue = parseFloat(
            String.prototype.replace.call(amount, /,/g, "")
        );
        const isAmountValid = amountValue && !isNaN(amountValue);
        const isSubmitNotValid =
            !from_account ||
            !to_account ||
            !isAmountValid ||
            !asset ||
            balanceError ||
            from_account.get("id") == to_account.get("id") ||
            !period.amount ||
            !num_of_periods ||
            !period_start_time;
        return (
            <Modal
                title={
                    operation && operation.type === "create"
                        ? counterpart.translate(
                              "showcases.direct_debit.create_new_mandate"
                          )
                        : counterpart.translate(
                              "showcases.direct_debit.update_mandate"
                          )
                }
                visible={this.props.isModalVisible}
                overlay={true}
                onCancel={this.props.hideModal}
                footer={[
                    <Button
                        key={"send"}
                        disabled={isSubmitNotValid}
                        onClick={
                            !isSubmitNotValid ? this.onSubmit.bind(this) : null
                        }
                    >
                        {operation && operation.type === "create"
                            ? counterpart.translate(
                                  "showcases.direct_debit.create"
                              )
                            : counterpart.translate(
                                  "showcases.direct_debit.update"
                              )}
                    </Button>,
                    <Button key="Cancel" onClick={this.props.hideModal}>
                        <Translate component="span" content="transfer.cancel" />
                    </Button>
                ]}
            >
                <div className="grid-block vertical no-overflow">
                    <Form className="full-width" layout="vertical">
                        <div>
                            {/* AUTHORIZED ACCOUNT */}
                            <Tooltip
                                title={counterpart.translate(
                                    "showcases.direct_debit.tooltip.authorized_account"
                                )}
                                mouseEnterDelay={0.5}
                            >
                                <div className="content-block">
                                    <AccountSelector
                                        label="showcases.direct_debit.authorized_account"
                                        accountName={to_name}
                                        account={to_account}
                                        onChange={this.toChanged.bind(this)}
                                        onAccountChanged={
                                            this.onToAccountChanged
                                        }
                                        size={60}
                                        typeahead={true}
                                        hideImage
                                    />
                                </div>
                            </Tooltip>
                        </div>
                        <Tooltip
                            title={counterpart.translate(
                                "showcases.direct_debit.tooltip.limit_per_period"
                            )}
                            mouseEnterDelay={0.5}
                        >
                            <div className="content-block transfer-input">
                                {/*  LIMIT */}
                                <AmountSelector
                                    label="showcases.direct_debit.limit_per_period"
                                    amount={amount}
                                    onChange={this.onAmountChanged}
                                    asset={
                                        asset_types.length > 0 && asset
                                            ? asset.get("id")
                                            : asset_id
                                            ? asset_id
                                            : asset_types[0]
                                    }
                                    assets={asset_types}
                                    display_balance={balance}
                                    allowNaN={true}
                                />
                            </div>
                        </Tooltip>
                        <Tooltip
                            title={counterpart.translate(
                                "showcases.direct_debit.tooltip.period"
                            )}
                            mouseEnterDelay={0.5}
                        >
                            <div className="content-block transfer-input">
                                {/*  PERIOD  */}
                                <PeriodSelector
                                    label="showcases.direct_debit.period"
                                    inputValue={period.amount}
                                    entries={["Minute", "Hour", "Day", "Week"]}
                                    values={{
                                        Minute: {seconds: 60, name: "Minute"},
                                        Hour: {seconds: 60 * 60, name: "Hour"},
                                        Day: {
                                            seconds: 60 * 60 * 24,
                                            name: "Day"
                                        },
                                        Week: {
                                            seconds: 60 * 60 * 24 * 7,
                                            name: "Week"
                                        }
                                    }}
                                    periodType={period.type}
                                    onChange={this.onPeriodChanged}
                                />
                            </div>
                        </Tooltip>
                        <Tooltip
                            title={counterpart.translate(
                                "showcases.direct_debit.tooltip.num_of_periods"
                            )}
                            mouseEnterDelay={0.5}
                        >
                            <div className="content-block transfer-input">
                                {/*  NUMBEER OF PERIODS  */}
                                <label className="left-label">
                                    {counterpart.translate(
                                        "showcases.direct_debit.num_of_periods"
                                    )}
                                </label>
                                <input
                                    type="number"
                                    value={num_of_periods}
                                    onChange={this.onNumOfPeriodsChanged}
                                />
                            </div>
                        </Tooltip>
                        <div className="content-block transfer-input">
                            {/*  START DATE  */}
                            <label className="left-label">
                                {counterpart.translate(
                                    "showcases.direct_debit.start_date"
                                )}
                            </label>
                            <Tooltip
                                title={counterpart.translate(
                                    "showcases.direct_debit.tooltip.start_time"
                                )}
                                mouseEnterDelay={0.5}
                            >
                                <DatePicker
                                    value={period_start_time}
                                    showToday={false}
                                    showTime
                                    placeholder=""
                                    onChange={this.onStartDateChanged}
                                    className="date-picker-width100"
                                    style={{width: "100%"}}
                                    ref={el => this.onDatepickerRef(el)}
                                    disabledDate={current =>
                                        current &&
                                        current < moment().add(2, "minutes")
                                    }
                                />
                            </Tooltip>
                        </div>
                        <div className="content-block transfer-input">
                            <div className="no-margin no-padding">
                                {/*  F E E  */}

                                <FeeAssetSelector
                                    label="transfer.fee"
                                    account={from_account}
                                    trxInfo={{
                                        type:
                                            operation &&
                                            operation.type === "update"
                                                ? "withdraw_permission_update"
                                                : "withdraw_permission_create",
                                        options: ["price_per_kbyte"],
                                        data: {
                                            type: "memo",
                                            content: null
                                        }
                                    }}
                                    onChange={this.onFeeChanged.bind(this)}
                                />
                            </div>
                        </div>
                    </Form>
                </div>
            </Modal>
        );
    }
}

export default connect(
    DirectDebitModal,
    {
        listenTo() {
            return [AccountStore, SettingsStore];
        },
        getProps() {
            return {
                currentAccount: AccountStore.getState().currentAccount,
                passwordAccount: AccountStore.getState().passwordAccount,
                fee_asset_symbol: SettingsStore.getState().settings.get(
                    "fee_asset"
                )
            };
        }
    }
);
