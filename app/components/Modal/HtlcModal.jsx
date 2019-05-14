import React from "react";
import Translate from "react-translate-component";
import {ChainStore, key} from "bitsharesjs";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import cnames from "classnames";
import AccountSelector from "../Account/AccountSelector";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import {Asset} from "common/MarketClasses";
import {debounce, isNaN} from "lodash-es";
import {
    checkFeeStatusAsync,
    checkBalance,
    shouldPayFeeWithAssetAsync
} from "common/trxHelper";
import BalanceComponent from "../Utility/BalanceComponent";
import utils from "common/utils";
import counterpart from "counterpart";
import CopyButton from "../Utility/CopyButton";

import {
    Form,
    Modal,
    Button,
    Select,
    Input,
    Icon as AntIcon,
    DatePicker,
    Tooltip
} from "bitshares-ui-style-guide";
import moment from "moment";
import HtlcActions from "actions/HtlcActions";
import "../../assets/stylesheets/components/_htlc.scss";
import ChainTypes from "../Utility/ChainTypes";
import PropTypes from "prop-types";
import {hasLoaded} from "../Utility/BindToCurrentAccount";

class Preimage extends React.Component {
    static propTypes = {
        hash: PropTypes.string,
        size: PropTypes.string
    };

    static defaultProps = {
        hash: null,
        size: null
    };

    constructor(props) {
        super(props);
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            activeSercret: false,
            preimage: "",
            ciphers: ["sha256", "ripemd160"],
            cipher: "sha256",
            hash: this.props.hash,
            size: this.props.size
        };
    }

    componentDidMount() {
        if (this.props.size || this.props.hash) {
            this.setState({size: this.props.size, hash: this.props.hash});
        }
        if (!this.props.hash) {
            // make sure there is always a hash if no hash given
            this.generateRandom({target: {}});
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            (this.props.size && this.props.size !== this.state.size) ||
            (this.props.hash && this.props.hash !== this.state.hash)
        ) {
            this.setState({size: this.props.size, hash: this.props.hash});
        }
    }

    onClick() {
        this.setState({
            activeSercret: !this.state.activeSercret
        });
    }

    onInputChanged(e) {
        let {preimage, cipher} = this.state;
        if (e.target) {
            preimage = e.target.value;
        } else {
            cipher = e;
        }
        const {hash} = HtlcActions.calculateHash({preimage, cipher});
        this.setState(
            {hash, size: preimage.length, preimage, cipher},
            this.props.onAction({preimage, cipher})
        );
    }

    generateRandom(e) {
        e.target.value = key
            .get_random_key()
            .toWif()
            .substr(10, 30);
        this.onInputChanged(e);
    }

    render() {
        let label = (
            <React.Fragment>
                {counterpart.translate(this.props.label)}
                <AntIcon
                    className="inline-block"
                    style={{fontSize: "1rem", marginLeft: "10px"}}
                    type={"edit"}
                    onClick={this.onClick.bind(this)}
                />
            </React.Fragment>
        );
        return (
            <Form.Item label={label}>
                <span>
                    {counterpart.translate(
                        "showcases.htlc.preimage_has_been_created"
                    )}
                </span>
                <Input.Group className="content-block transfer-input preimage-row">
                    <Tooltip
                        title={counterpart.translate(
                            this.props.hash
                                ? "showcases.htlc.tooltip.enter_preimage"
                                : "showcases.htlc.tooltip.preimage_random"
                        )}
                    >
                        <Input
                            style={{width: "60%"}}
                            name="preimage"
                            id="preimage"
                            type="text"
                            onChange={this.onInputChanged.bind(this)}
                            value={this.state.preimage}
                            placeholder={counterpart.translate(
                                this.props.hash
                                    ? "showcases.htlc.enter_secret_preimage"
                                    : "showcases.htlc.preimage"
                            )}
                            readOnly={
                                this.props.hash
                                    ? false
                                    : !this.state.activeSercret
                            }
                        />
                    </Tooltip>
                    <Select
                        optionLabelProp={"value"}
                        style={{width: "19.5%"}}
                        onChange={this.onInputChanged.bind(this)}
                        value={this.state.cipher}
                    >
                        {this.state.ciphers.map(cipher => (
                            <Select.Option key={cipher} value={cipher}>
                                {cipher}
                            </Select.Option>
                        ))}
                    </Select>
                    <Tooltip
                        title={counterpart.translate(
                            "showcases.htlc.tooltip.new_random"
                        )}
                    >
                        <Button
                            type="primary"
                            icon="deployment-unit"
                            style={{verticalAlign: "top"}}
                            onClick={this.generateRandom.bind(this)}
                        />
                    </Tooltip>
                    <div style={{float: "right"}}>
                        <CopyButton
                            dataPlace="top"
                            text={
                                "preimage: " +
                                this.state.preimage +
                                " hash type: " +
                                this.state.cipher
                            }
                        />
                    </div>
                </Input.Group>

                <Input.Group className="content-block transfer-input preimage-row">
                    <Tooltip
                        title={counterpart.translate(
                            "showcases.htlc.tooltip.preimage_hash"
                        )}
                    >
                        <Input
                            style={{width: "78%"}}
                            name="hash"
                            id="hash"
                            type="text"
                            value={this.state.hash || ""}
                            placeholder={counterpart.translate(
                                "showcases.htlc.hash"
                            )}
                            readOnly={true}
                            disabled={this.props.isRedeem ? true : undefined}
                        />
                    </Tooltip>
                    <Tooltip
                        title={counterpart.translate(
                            "showcases.htlc.tooltip.preimage_size"
                        )}
                    >
                        <Input
                            style={{width: "53px", marginRight: "0.2rem"}}
                            name="size"
                            id="size"
                            type="text"
                            value={this.state.size || ""}
                            placeholder={counterpart.translate(
                                "showcases.htlc.size"
                            )}
                            readOnly={true}
                            disabled={this.props.isRedeem ? true : undefined}
                        />
                    </Tooltip>
                    <div style={{float: "right"}}>
                        <CopyButton
                            dataPlace="top"
                            text={
                                "hash: " +
                                this.state.hash +
                                " preimage size: " +
                                this.state.size
                            }
                        />
                    </div>
                </Input.Group>
            </Form.Item>
        );
    }
}
class HtlcModal extends React.Component {
    static propTypes = {
        isModalVisible: PropTypes.bool.isRequired,
        hideModal: PropTypes.func.isRequired,
        fromAccount: ChainTypes.ChainObject.isRequired,
        operation: PropTypes.object // optional, only when editing
    };

    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
        this._updateFee = debounce(this._updateFee.bind(this), 250);
        this._checkFeeStatus = this._checkFeeStatus.bind(this);
        this._checkBalance = this._checkBalance.bind(this);
    }

    getInitialState() {
        const now = moment().add("seconds", 120);
        return {
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,
            amount: "",
            asset_id: null,
            asset: null,
            error: null,
            feeAsset: null,
            fee_asset_id: "1.3.0",
            feeAmount: new Asset({amount: 0}),
            feeStatus: {},
            maxAmount: false,
            num_of_periods: "",
            period_start_time: now,
            htlcId: "",
            balanceError: false,
            preimage: null,
            cipher: null,
            claim_period: 86400,
            period: "one_day",
            expirationDate: moment()
                .add("seconds", 180)
                .add(1, "day")
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
            preimage,
            cipher,
            claim_period
        } = this.state;
        const {
            operation: {type: operationType}
        } = this.props;

        if (operationType === "create") {
            HtlcActions.create({
                from_account_id: from_account.get("id"),
                to_account_id: to_account.get("id"),
                asset_id,
                amount: utils.convert_typed_to_satoshi(amount, asset),
                lock_time: claim_period,
                preimage,
                cipher
            })
                .then(result => {
                    this.props.hideModal();
                })
                .catch(err => {
                    // todo: visualize error somewhere
                    console.error(err);
                });
        } else if (operationType === "redeem") {
            HtlcActions.redeem({
                htlc_id: this.props.operation.payload.id,
                user_id: to_account.get("id"),
                preimage: preimage
            })
                .then(result => {
                    this.props.hideModal();
                })
                .catch(err => {
                    // todo: visualize error somewhere
                    console.error(err);
                });
        } else if (operationType === "extend") {
            HtlcActions.extend({
                htlc_id: this.props.operation.payload.id,
                user_id: from_account.get("id"),
                seconds_to_add: claim_period
            })
                .then(result => {
                    this.props.hideModal();
                })
                .catch(err => {
                    // todo: visualize error somewhere
                    console.error(err);
                });
        }
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.fromAccount && !hasLoaded(nextProps.fromAccount)) {
            return false;
        }
        return true;
    }

    componentDidMount() {
        let operation = this.props.operation;
        if (operation && operation.payload) {
            this._syncOperation(operation);
        }
    }

    _syncOperation(operation) {
        const to = operation.payload.transfer.to;
        const from = operation.payload.transfer.from;
        const amount = {
            amount: operation.payload.transfer.amount,
            asset_id: operation.payload.transfer.asset_id
        };
        const expiration = new Date(
            operation.payload.conditions.time_lock.expiration
        );
        const toAccount = ChainStore.getAccount(to);
        const fromAccount = ChainStore.getAccount(from);
        if (toAccount && fromAccount && toAccount.get && fromAccount.get) {
            const asset = ChainStore.getAsset(amount.asset_id, false);
            this.setState({
                to_account: toAccount,
                to_name: toAccount.get("name"),
                from_account: fromAccount,
                from_name: fromAccount.get("name"),
                asset: asset,

                amount: utils.convert_satoshi_to_typed(amount.amount, asset),
                asset_id: amount.asset_id,
                period_start_time: expiration, // no selection for that
                htlcId: operation.payload.id,
                hash: operation.payload.conditions.hash_lock.preimage_hash[1],
                size: operation.payload.conditions.hash_lock.preimage_hash[0]
            });
        } else {
            // ensure it's always in-sync
            this.setState({
                htlcId: operation.payload.id,
                hash: operation.payload.conditions.hash_lock.preimage_hash[1],
                size: operation.payload.conditions.hash_lock.preimage_hash[0]
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const {operation} = this.props;
        if (this.props.fromAccount !== prevProps.fromAccount) {
            // refesh balances and fee
            // write props to state
            this.setState(
                {
                    from_account: this.props.fromAccount
                },
                () => {
                    this._updateFee();
                    this._checkFeeStatus(this.state);
                }
            );
        }
        // extend and redeem operations
        if (operation !== prevProps.operation && operation.type !== "create") {
            this._syncOperation(operation);
        }
    }

    _checkBalance() {
        const {feeAmount, amount, from_account, asset} = this.state;
        if (!asset || !from_account) return;
        this._updateFee();
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
            this.setState({fee_asset_id: "1.3.0"}, this._updateFee);
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

    _checkFeeStatus(state = this.state) {
        const {from_account} = state;
        const {isModalVisible, operation} = this.props;
        if (!from_account || !isModalVisible) return;

        const assets = Object.keys(from_account.get("balances").toJS()).sort(
            utils.sortID
        );
        let feeStatus = {};
        let p = [];
        assets.forEach(a => {
            p.push(
                checkFeeStatusAsync({
                    accountID: from_account.get("id"),
                    feeID: a,
                    type:
                        operation && operation.type === "create"
                            ? "htlc_create"
                            : operation && operation.type === "redeem"
                                ? "htlc_redeem"
                                : "htlc_extend",
                    data: {
                        type: "memo",
                        content: null
                    }
                })
            );
        });
        Promise.all(p)
            .then(status => {
                assets.forEach((a, idx) => {
                    feeStatus[a] = status[idx];
                });
                if (!utils.are_equal_shallow(this.state.feeStatus, feeStatus)) {
                    this.setState({
                        feeStatus
                    });
                }
                this._checkBalance();
            })
            .catch(err => {
                console.error(err);
            });
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
        const {feeStatus} = this.state;
        function hasFeePoolBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasPoolBalance;
        }

        function hasBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasBalance;
        }
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

        fee_asset_types = fee_asset_types.filter(a => {
            return hasFeePoolBalance(a) && hasBalance(a);
        });

        return {asset_types, fee_asset_types};
    }

    _updateFee(state = this.state) {
        if (!this.props.isModalVisible) return;
        const {operation} = this.props;
        let {fee_asset_id, from_account, asset_id} = state;
        const {fee_asset_types} = this._getAvailableAssets(state);
        if (
            fee_asset_types.length === 1 &&
            fee_asset_types[0] !== fee_asset_id
        ) {
            fee_asset_id = fee_asset_types[0];
        }
        if (!from_account) return null;
        checkFeeStatusAsync({
            accountID: from_account.get("id"),
            feeID: fee_asset_id,
            type:
                operation && operation.type === "create"
                    ? "htlc_create"
                    : operation && operation.type === "redeem"
                        ? "htlc_redeem"
                        : "htlc_extend",
            data: {
                type: "memo",
                content: null
            }
        }).then(({fee, hasBalance, hasPoolBalance}) => {
            shouldPayFeeWithAssetAsync(from_account, fee).then(
                should =>
                    should
                        ? this.setState(
                              {fee_asset_id: asset_id},
                              this._updateFee
                          )
                        : this.setState({
                              feeAmount: fee,
                              fee_asset_id: fee.asset_id,
                              hasBalance,
                              hasPoolBalance,
                              error: !hasBalance || !hasPoolBalance
                          })
            );
        });
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

    onFeeChanged({asset}) {
        this.setState(
            {feeAsset: asset, fee_asset_id: asset.get("id"), error: null},
            this._updateFee
        );
    }

    onTrxIncluded(confirm_store_state) {
        if (
            confirm_store_state.included &&
            confirm_store_state.broadcasted_transaction
        ) {
            // this.setState(Transfer.getInitialState());
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        } else if (confirm_store_state.closed) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        }
    }

    onDatepickerRef(el) {
        if (el && el.picker.input) {
            el.picker.input.readOnly = false;
        }
    }

    onExpirationDateChanged = utcValue => {
        if (utcValue) {
            const {period_start_time} = this.state;
            const exp = utcValue.valueOf();
            const start = period_start_time.valueOf();
            const claim_period = Math.floor((exp - start) / 1000);
            this.setState({
                claim_period,
                period: null,
                expirationDate: utcValue
            });
        } else {
            this.setState({
                claim_period: 0,
                period: null,
                expirationDate: null
            });
        }
    };

    onHashCreate({preimage, cipher}) {
        this.setState({preimage, cipher});
    }

    setPeriod = days => {
        let estimatedExpiry = moment().add(days, "day");
        let period = "one_day";
        const claim_period = days * 60 * 60 * 24; // convert day to seconds
        switch (days) {
            case 1:
                period = "one_day";
                break;
            case 2:
                period = "two_days";
                break;
            case 7:
                period = "one_week";
                break;
        }

        this.setState({
            claim_period,
            period,
            expirationDate: estimatedExpiry
        });
    };

    render() {
        let {
            from_account,
            to_account,
            asset,
            asset_id,
            feeAmount,
            amount,
            from_name,
            to_name,
            feeAsset,
            fee_asset_id,
            balanceError,
            preimage,
            cipher,
            claim_period,
            hash,
            size,
            period_start_time,
            expirationDate
        } = this.state;

        const {operation} = this.props;

        const isExtend = operation && operation.type === "extend";
        const isRedeem = operation && operation.type === "redeem";

        let {asset_types, fee_asset_types} = this._getAvailableAssets();

        let balance = null;
        let balance_fee = null;

        // Estimate fee
        let fee = this.state.feeAmount.getAmount({real: true});

        if (from_account && from_account.get("balances")) {
            let account_balances = from_account.get("balances").toJS();
            let _error = this.state.balanceError ? "has-error" : "";
            if (asset_types.length === 1)
                asset = ChainStore.getAsset(asset_types[0]);
            if (asset_types.length > 0) {
                let current_asset_id = asset ? asset.get("id") : asset_types[0];
                let feeID = feeAsset ? feeAsset.get("id") : "1.3.0";

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
            !((cipher && preimage) || hash) ||
            !claim_period;
        let modalTitle =
            operation && operation.type === "create"
                ? counterpart.translate("showcases.htlc.create_htlc")
                : isExtend
                    ? counterpart.translate("showcases.htlc.extend_htlc")
                    : counterpart.translate("showcases.htlc.redeem_htlc");
        let sendButtonText =
            operation && operation.type === "create"
                ? counterpart.translate("showcases.direct_debit.create")
                : counterpart.translate("showcases.direct_debit.update");

        const amountHeader = (
            <div className="form-input-header--label">
                {counterpart.translate("showcases.htlc.expiration_date")}
                <div className="form-input-header--right">
                    <span
                        className={cnames("period-row", {
                            "is-active": this.state.period === "one_day"
                        })}
                        onClick={() => this.setPeriod(1)}
                    >
                        {counterpart.translate(
                            "showcases.htlc.expiration_period.one_day"
                        )}
                    </span>
                    <span
                        className={cnames("period-row", {
                            "is-active": this.state.period === "two_days"
                        })}
                        onClick={() => this.setPeriod(2)}
                    >
                        {counterpart.translate(
                            "showcases.htlc.expiration_period.two_days"
                        )}
                    </span>
                    <span
                        className={cnames("period-row", {
                            "is-active": this.state.period === "one_week"
                        })}
                        onClick={() => this.setPeriod(7)}
                    >
                        {counterpart.translate(
                            "showcases.htlc.expiration_period.one_week"
                        )}
                    </span>
                </div>
            </div>
        );

        return (
            <Modal
                title={modalTitle}
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
                        {sendButtonText}
                    </Button>,
                    <Button key="Cancel" onClick={this.props.hideModal}>
                        <Translate component="span" content="transfer.cancel" />
                    </Button>
                ]}
            >
                <div className="grid-block vertical no-overflow">
                    <Form className="full-width" layout="vertical">
                        {/* Sender */}
                        {isRedeem ? (
                            <AccountSelector
                                label="showcases.htlc.sender"
                                accountName={from_name}
                                account={from_account}
                                size={60}
                                typeahead={true}
                                hideImage
                                disabled={true}
                            />
                        ) : null}

                        <AccountSelector
                            label="showcases.htlc.recipient"
                            accountName={to_name}
                            account={to_account}
                            onChange={this.toChanged.bind(this)}
                            onAccountChanged={this.onToAccountChanged}
                            size={60}
                            typeahead={true}
                            hideImage
                            disabled={isExtend || isRedeem}
                        />

                        {!isRedeem ? (
                            <AmountSelector
                                label="showcases.htlc.amount"
                                amount={amount}
                                onChange={this.onAmountChanged.bind(this)}
                                asset={
                                    asset_types.length > 0 && asset
                                        ? asset.get("id")
                                        : asset_id
                                            ? asset_id
                                            : asset_types[0]
                                }
                                assets={asset_types}
                                display_balance={
                                    isExtend || isRedeem ? undefined : balance
                                }
                                allowNaN={true}
                                disabled={isExtend || isRedeem}
                                selectDisabled={isExtend || isRedeem}
                            />
                        ) : null}

                        {/*  Preimage */}
                        {isExtend ? (
                            <Form.Item
                                label={counterpart.translate(
                                    "showcases.htlc.preimage"
                                )}
                            >
                                <Input
                                    type="text"
                                    value={hash || ""}
                                    placeholder={counterpart.translate(
                                        "showcases.htlc.hash"
                                    )}
                                    readOnly={true}
                                    disabled={true}
                                />
                            </Form.Item>
                        ) : (
                            <Preimage
                                label="showcases.htlc.preimage"
                                onAction={this.onHashCreate.bind(this)}
                                hash={hash}
                                size={size}
                            />
                        )}

                        {!isRedeem ? (
                            <div>
                                {/*  Expiration  */}
                                <Form.Item
                                    label={amountHeader}
                                    validateStatus={""}
                                    className="form-input-header"
                                >
                                    <DatePicker
                                        showToday={true}
                                        showTime
                                        placeholder=""
                                        onChange={this.onExpirationDateChanged}
                                        className="date-picker-width100"
                                        style={{width: "100%"}}
                                        ref={el => this.onDatepickerRef(el)}
                                        disabledDate={current =>
                                            current &&
                                            current < period_start_time
                                        }
                                        value={expirationDate}
                                    />
                                </Form.Item>
                                <div className="content-block transfer-input">
                                    <div className="no-margin no-padding">
                                        {/*  F E E  */}
                                        <div
                                            id="txFeeSelector"
                                            className="small-12"
                                        >
                                            <AmountSelector
                                                label="transfer.fee"
                                                disabled={true}
                                                amount={fee}
                                                onChange={this.onFeeChanged.bind(
                                                    this
                                                )}
                                                asset={
                                                    fee_asset_types.length &&
                                                    feeAmount
                                                        ? feeAmount.asset_id
                                                        : fee_asset_types.length ===
                                                          1
                                                            ? fee_asset_types[0]
                                                            : fee_asset_id
                                                                ? fee_asset_id
                                                                : fee_asset_types[0]
                                                }
                                                assets={fee_asset_types}
                                                display_balance={balance_fee}
                                                // tabIndex={tabIndex++}
                                                error={
                                                    this.state
                                                        .hasPoolBalance ===
                                                    false
                                                        ? "transfer.errors.insufficient"
                                                        : null
                                                }
                                                scroll_length={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </Form>
                </div>
            </Modal>
        );
    }
}

export default HtlcModal;
