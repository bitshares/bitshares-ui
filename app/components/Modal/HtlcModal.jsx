import React from "react";
import Translate from "react-translate-component";
import {ChainStore, key} from "tuscjs";
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
    Tooltip,
    Radio
} from "bitshares-ui-style-guide";
import moment from "moment";
import HtlcActions from "actions/HtlcActions";
import "../../assets/stylesheets/components/_htlc.scss";
import ChainTypes from "../Utility/ChainTypes";
import PropTypes from "prop-types";
import {hasLoaded} from "../Utility/BindToCurrentAccount";

class Preimage extends React.Component {
    static propTypes = {
        preimage_hash: PropTypes.string,
        preimage_size: PropTypes.number,
        preimage: PropTypes.string,
        preimage_cipher: PropTypes.string
    };

    constructor(props) {
        super(props);
        this.state = this.getInitialState();
        this.hasRandomHash = false;
    }

    getInitialState() {
        return {
            stage: 1,
            preimage_hash_calculated: null,
            ciphers: ["sha256", "ripemd160"]
        };
    }

    componentDidMount() {
        if (!this.props.preimage_hash && !this.hasRandomHash) {
            // make sure there is always a hash if no hash given
            this.generateRandom({target: {}});
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevProps.preimage_hash !== this.props.preimage_hash &&
            !this.props.preimage_hash
        ) {
            this.hasRandomHash = false;
        }
        if (!this.props.preimage_hash && !this.hasRandomHash) {
            // make sure there is always a hash if no hash given
            this.generateRandom({target: {}});
        }
    }

    onClick(e) {
        let redo = false;
        if (this.state.stage !== e.target.value && e.target.value == 1) {
            redo = true;
        }
        this.setState(
            {
                stage: e.target.value
            },
            () => (redo ? this.generateRandom() : null)
        );
    }

    onSizeChanged(e) {
        this.props.onAction({
            preimage_size: !e.target.value ? null : parseInt(e.target.value)
        });
    }

    onHashChanged(e) {
        this.props.onAction({
            preimage_hash: e.target.value
        });
    }

    onInputChanged(e) {
        let {preimage, preimage_cipher} = this.props;
        if (!preimage_cipher) {
            preimage_cipher = "sha256";
        }
        if (e.target) {
            preimage = e.target.value;
            this.hashingInProgress = false;
        } else {
            preimage_cipher = e;
        }
        if (this.state.stage == 2) {
            this.props.onAction({
                preimage_cipher: preimage_cipher
            });
        } else {
            const {hash} = HtlcActions.calculateHash(preimage, preimage_cipher);
            if (this.props.type !== "create") {
                // user tries to match hash
                this.props.onAction({
                    preimage,
                    preimage_cipher: preimage_cipher,
                    preimage_size: preimage.length
                });
                this.setState({
                    preimage_hash_calculated: hash
                });
            } else {
                this.props.onAction({
                    preimage,
                    preimage_cipher: preimage_cipher,
                    preimage_hash: hash,
                    preimage_size: preimage.length
                });
            }
        }
    }

    generateRandom(e = {target: {}}) {
        this.hasRandomHash = true;
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
                {this.props.type == "create" && (
                    <Radio.Group
                        value={this.state.stage}
                        onChange={this.onClick.bind(this)}
                        style={{
                            marginBottom: "7px",
                            marginLeft: "24px"
                        }}
                    >
                        <Radio value={1}>
                            <Translate content="showcases.htlc.first_stage" />
                        </Radio>
                        <Radio value={2}>
                            <Translate content="showcases.htlc.second_stage" />
                        </Radio>
                        <Radio value={3}>
                            <Translate content="showcases.htlc.custom" />
                        </Radio>
                    </Radio.Group>
                )}
            </React.Fragment>
        );

        // if user redeems, indicate if it matches
        let hashMatch =
            this.props.type !== "create" &&
            this.state.preimage_hash_calculated !== null
                ? this.state.preimage_hash_calculated ==
                  this.props.preimage_hash
                : null;

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
                            this.props.type !== "create"
                                ? "showcases.htlc.tooltip.enter_preimage"
                                : "showcases.htlc.tooltip.preimage_random"
                        )}
                        mouseEnterDelay={0.5}
                    >
                        <Input
                            style={{
                                width: "60%",
                                color:
                                    hashMatch == null
                                        ? undefined
                                        : hashMatch
                                        ? "green"
                                        : "red"
                            }}
                            name="preimage"
                            id="preimage"
                            type="text"
                            onChange={this.onInputChanged.bind(this)}
                            value={
                                this.state.stage == 2 ? "" : this.props.preimage
                            }
                            placeholder={counterpart.translate(
                                this.props.hash
                                    ? "showcases.htlc.enter_secret_preimage"
                                    : "showcases.htlc.preimage"
                            )}
                            disabled={
                                this.props.type !== "create"
                                    ? false
                                    : this.state.stage == 1 ||
                                      this.state.stage == 2
                            }
                        />
                    </Tooltip>
                    <Select
                        optionLabelProp={"value"}
                        style={{width: "19.5%"}}
                        onChange={this.onInputChanged.bind(this)}
                        value={this.props.preimage_cipher}
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
                        mouseEnterDelay={0.5}
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
                                this.props.preimage +
                                " hash type: " +
                                this.props.preimage_cipher
                            }
                        />
                    </div>
                </Input.Group>

                <Input.Group className="content-block transfer-input preimage-row">
                    <Tooltip
                        title={counterpart.translate(
                            "showcases.htlc.tooltip.preimage_hash"
                        )}
                        mouseEnterDelay={0.5}
                    >
                        <Input
                            style={{width: "78%"}}
                            name="hash"
                            id="hash"
                            type="text"
                            onChange={this.onHashChanged.bind(this)}
                            value={this.props.preimage_hash || ""}
                            placeholder={counterpart.translate(
                                "showcases.htlc.hash"
                            )}
                            disabled={this.state.stage == 1}
                        />
                    </Tooltip>
                    <Tooltip
                        title={counterpart.translate(
                            "showcases.htlc.tooltip.preimage_size"
                        )}
                        mouseEnterDelay={0.5}
                    >
                        <Input
                            style={{width: "53px", marginRight: "0.2rem"}}
                            name="size"
                            id="size"
                            type="text"
                            onChange={this.onSizeChanged.bind(this)}
                            value={this.props.preimage_size || ""}
                            placeholder={counterpart.translate(
                                "showcases.htlc.size"
                            )}
                            disabled={this.state.stage == 1}
                        />
                    </Tooltip>
                    <div style={{float: "right"}}>
                        <CopyButton
                            dataPlace="top"
                            text={
                                "hash: " +
                                this.props.preimage_hash +
                                " preimage size: " +
                                this.props.preimage_size
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
            preimage_cipher: null,
            preimage_hash: null,
            preimage_size: null,
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
            preimage_size,
            preimage_hash,
            preimage_cipher,
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
                preimage_size,
                preimage_hash,
                preimage_cipher
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

    _syncOperation(operation) {
        if (operation && operation.payload && operation.type !== "create") {
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

                    amount: utils.convert_satoshi_to_typed(
                        amount.amount,
                        asset
                    ),
                    asset_id: amount.asset_id,
                    period_start_time: expiration, // no selection for that
                    htlcId: operation.payload.id,
                    preimage_hash:
                        operation.payload.conditions.hash_lock.preimage_hash[1],
                    preimage_size:
                        operation.payload.conditions.hash_lock.preimage_hash[0]
                });
            } else {
                this.setState({
                    htlcId: operation.payload.id,
                    preimage_hash:
                        operation.payload.conditions.hash_lock.preimage_hash[1],
                    preimage_size:
                        operation.payload.conditions.hash_lock.preimage_hash[0]
                });
            }
        } else {
            // ensure it's always in-sync
            this.setState({
                htlcId: null,
                preimage_hash: null,
                preimage_size: null
            });
        }
    }

    componentDidMount() {
        this._syncOperation(this.props.operation);
    }

    componentDidUpdate(prevProps, prevState) {
        const {operation} = this.props;
        if (
            this.props.fromAccount !== prevProps.fromAccount ||
            this.state.from_account == null
        ) {
            // refesh balances and fee
            // write props to state
            this.setState(
                {
                    from_account: this.props.fromAccount,
                    from_name: this.props.fromAccount.get("name")
                },
                () => {
                    this._updateFee();
                    this._checkFeeStatus(this.state);
                }
            );
        }
        if (prevProps.operation !== this.props.operation) {
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
            shouldPayFeeWithAssetAsync(from_account, fee).then(should =>
                should
                    ? this.setState({fee_asset_id: asset_id}, this._updateFee)
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

        if (typeof asset !== "object") {
            asset = ChainStore.getAsset(asset);
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
        if (typeof asset !== "object") {
            asset = ChainStore.getAsset(asset);
        }
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

    onPreimageChanged({
        preimage,
        preimage_cipher,
        preimage_hash,
        preimage_size
    }) {
        let stateChange = {};
        if (preimage !== undefined) {
            stateChange.preimage = preimage;
        }
        if (preimage_cipher !== undefined) {
            stateChange.preimage_cipher = preimage_cipher;
        }
        if (preimage_hash !== undefined) {
            stateChange.preimage_hash = preimage_hash;
        }
        if (preimage_size !== undefined) {
            stateChange.preimage_size = preimage_size;
        }
        this.setState(stateChange);
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
            preimage_cipher,
            claim_period,
            preimage_hash,
            preimage_size,
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
            !((preimage_cipher && preimage) || preimage_hash) ||
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
                        <AccountSelector
                            label="showcases.htlc.sender"
                            accountName={from_name}
                            account={from_account}
                            size={60}
                            typeahead={true}
                            hideImage
                            disabled={true}
                        />

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
                                    value={preimage_hash || ""}
                                    placeholder={counterpart.translate(
                                        "showcases.htlc.hash"
                                    )}
                                    readOnly={true}
                                    disabled={true}
                                />
                            </Form.Item>
                        ) : (
                            <Preimage
                                ref={tmp => (this.preimage = tmp)}
                                label="showcases.htlc.preimage"
                                onAction={this.onPreimageChanged.bind(this)}
                                preimage_hash={preimage_hash}
                                preimage_size={preimage_size}
                                preimage={preimage}
                                preimage_cipher={preimage_cipher}
                                type={
                                    operation && operation.type
                                        ? operation.type
                                        : "create"
                                }
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
