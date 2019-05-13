import React from "react";
import Translate from "react-translate-component";
import {ChainStore, key} from "bitsharesjs";
import AmountSelector from "../Utility/AmountSelector";
import cnames from "classnames";
import AccountStore from "stores/AccountStore";
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
import {connect} from "alt-react";
import {
    Modal,
    Button,
    Select,
    Input,
    Icon as AntIcon
} from "bitshares-ui-style-guide";
import {DatePicker} from "antd";
import moment from "moment";
import HtlcActions from "actions/HtlcActions";
import "../../assets/stylesheets/components/_htlc.scss";

class Preimage extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.InitialState();
        this.preimageInput = React.createRef();
    }

    InitialState() {
        return {
            activeSercret: false,
            preimage: "",
            ciphers: ["sha256", "ripemd160", "sha1"],
            cipher: "sha256",
            hash: "",
            size: ""
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            !this.props.isModalVisible &&
            prevProps.isModalVisible !== this.props.isModalVisible
        ) {
            this.setState(this.InitialState()); // reset state
        }
        if (prevState.hash !== this.props.hash && this.props.isRedeem) {
            this.setState({hash: this.props.hash});
        }
    }

    onClick() {
        this.setState(
            {
                activeSercret: !this.state.activeSercret,
                preimage: "",
                cipher: "sha256",
                hash: "",
                size: ""
            },
            this.props.onAction({preimage: null, cipher: null})
        );
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
        e.target.value = ("P" + key.get_random_key().toWif()).substr(0, 30);
        this.onInputChanged(e);
    }

    render() {
        return (
            <div className="grid-block vertical no-overflow">
                <div>
                    <label className="left-label inline-block">
                        {counterpart.translate(this.props.label)}
                    </label>
                    <AntIcon
                        className="inline-block"
                        style={{fontSize: "1rem", marginLeft: "10px"}}
                        type={"edit"}
                        onClick={this.onClick.bind(this)}
                    />
                </div>
                <h6>{counterpart.translate("showcases.htlc.howto")}</h6>

                <Input.Group className="content-block transfer-input preimage-row">
                    <Input
                        style={{width: "60%"}}
                        name="preimage"
                        id="preimage"
                        type="text"
                        onChange={this.onInputChanged.bind(this)}
                        value={this.state.preimage}
                        placeholder={counterpart.translate(
                            "showcases.htlc.preimage"
                        )}
                        disabled={!this.state.activeSercret}
                    />
                    <Select
                        optionLabelProp={"value"}
                        style={{width: "20%"}}
                        onChange={this.onInputChanged.bind(this)}
                        value={this.state.cipher}
                    >
                        {this.state.ciphers.map(cipher => (
                            <Select.Option key={cipher} value={cipher}>
                                {cipher}
                            </Select.Option>
                        ))}
                    </Select>
                    <Button
                        type="primary"
                        icon="deployment-unit"
                        style={{verticalAlign: "top"}}
                        onClick={this.generateRandom.bind(this)}
                    />
                    <div style={{float: "right"}}>
                        <CopyButton text={this.state.preimage} />
                    </div>
                </Input.Group>

                <Input.Group className="content-block transfer-input preimage-row">
                    <Input
                        style={{width: "79%"}}
                        name="hash"
                        id="hash"
                        type="text"
                        value={this.state.hash || ""}
                        placeholder={counterpart.translate(
                            "showcases.htlc.hash"
                        )}
                        readOnly={true}
                    />
                    <Input
                        style={{width: "53px"}}
                        name="size"
                        id="size"
                        type="text"
                        value={this.state.size || ""}
                        placeholder={counterpart.translate(
                            "showcases.htlc.size"
                        )}
                        readOnly={true}
                    />
                    <CopyButton text={this.state.hash} />
                </Input.Group>
            </div>
        );
    }
}
class HtlcModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
        this._updateFee = debounce(this._updateFee.bind(this), 250);
        this._checkFeeStatus = this._checkFeeStatus.bind(this);
        this._checkBalance = this._checkBalance.bind(this);
        this._isMounted = false;
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
            expirationDate: null
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
                htlc_id: this.props.operation.payload.result[1],
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
                htlc_id: this.props.operation.payload.result[1],
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

    componentDidMount() {
        this._isMounted = true;
    }

    componentDidUpdate(prevProps, prevState) {
        const {operation} = this.props;
        if (
            this.props.isModalVisible &&
            prevProps.isModalVisible !== this.props.isModalVisible
        ) {
            this.setState(
                {
                    from_account: ChainStore.getAccount(
                        this.props.currentAccount
                    )
                },
                () => {
                    this._updateFee();
                    this._checkFeeStatus(this.state);
                }
            );
        } else if (
            !this.props.isModalVisible &&
            prevProps.isModalVisible !== this.props.isModalVisible
        ) {
            this.setState(this.getInitialState()); // reset state
        }

        // extend and redeem operations
        if (
            operation &&
            operation.type !== "create" &&
            operation.payload.id !== prevState.htlcId
        ) {
            const {
                to,
                from,
                amount,
                claim_period_seconds,
                preimage_hash
            } = operation.payload.op[1];

            const toAccount = ChainStore.getAccount(to);
            const fromAccount = ChainStore.getAccount(from);

            if (toAccount && fromAccount && toAccount.get && fromAccount.get) {
                const asset = ChainStore.getAsset(amount.asset_id, false);
                const globalObject = ChainStore.getObject("2.0.0");
                const dynGlobalObject = ChainStore.getObject("2.1.0");
                let block_time = utils.calc_block_time(
                    operation.payload.block_num,
                    globalObject,
                    dynGlobalObject
                );
                const period_start = new Date(block_time).getTime();
                const periodMs = claim_period_seconds * 1000;
                const expiration = new Date(period_start + periodMs);

                this.setState({
                    to_account: toAccount,
                    to_name: toAccount.get("name"),
                    from_account: fromAccount,
                    from_name: fromAccount.get("name"),
                    asset: asset,
                    htlcId: operation.payload.id,
                    amount: utils.convert_satoshi_to_typed(
                        amount.amount,
                        asset
                    ),
                    asset_id: amount.asset_id,
                    period_start_time: expiration,
                    hash: preimage_hash[1]
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
        let period = "one_day";
        if (days === 2) {
            period = "two_days";
        } else if (days === 7) period = "one_week";
        const claim_period = days * 60 * 60 * 24; //convert day to seconds
        this.setState({claim_period, period, expirationDate: null});
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
        return (
            <Modal
                title={
                    operation && operation.type === "create"
                        ? counterpart.translate("showcases.htlc.create_htlc")
                        : isExtend
                        ? counterpart.translate("showcases.htlc.extend_htlc")
                        : counterpart.translate("showcases.htlc.redeem_htlc")
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
                    <div noValidate>
                        {/* Sender */}
                        {isRedeem ? (
                            <div className="content-block">
                                <AccountSelector
                                    label="showcases.htlc.sender"
                                    accountName={from_name}
                                    account={from_account}
                                    size={60}
                                    typeahead={true}
                                    hideImage
                                    disabled={true}
                                />
                            </div>
                        ) : null}

                        <div>
                            {/* Recipient */}
                            <div className="content-block">
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
                            </div>
                        </div>

                        {!isRedeem ? (
                            <div className="content-block transfer-input">
                                {/* Amount */}
                                <AmountSelector
                                    label="showcases.htlc.amount"
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
                                    disabled={isExtend || isRedeem}
                                />
                            </div>
                        ) : null}

                        <div className="content-block transfer-input">
                            {/*  Preimage */}
                            {isExtend ? (
                                <Input
                                    type="text"
                                    value={hash || ""}
                                    placeholder={counterpart.translate(
                                        "showcases.htlc.hash"
                                    )}
                                    readOnly={true}
                                    disabled={true}
                                />
                            ) : (
                                <Preimage
                                    label="showcases.htlc.preimage"
                                    onAction={this.onHashCreate.bind(this)}
                                    action_label="showcases.htlc.preimage_secret_button"
                                    isModalVisible={this.props.isModalVisible}
                                    hash={hash}
                                    size={size}
                                    isRedeem={isRedeem}
                                />
                            )}
                        </div>

                        {!isRedeem ? (
                            <div>
                                <div className="content-block transfer-input">
                                    {/*  Expiration  */}
                                    <div>
                                        <label className="left-label inline-block">
                                            {counterpart.translate(
                                                "showcases.htlc.expiration_date"
                                            )}
                                        </label>
                                        <div
                                            className="inline-block"
                                            style={{float: "right"}}
                                        >
                                            <span
                                                className={cnames(
                                                    "period-row",
                                                    {
                                                        "is-active":
                                                            this.state
                                                                .period ===
                                                            "one_day"
                                                    }
                                                )}
                                                onClick={() =>
                                                    this.setPeriod(1)
                                                }
                                            >
                                                {counterpart.translate(
                                                    "showcases.htlc.expiration_period.one_day"
                                                )}
                                            </span>
                                            <span
                                                className={cnames(
                                                    "period-row",
                                                    {
                                                        "is-active":
                                                            this.state
                                                                .period ===
                                                            "two_days"
                                                    }
                                                )}
                                                onClick={() =>
                                                    this.setPeriod(2)
                                                }
                                            >
                                                {counterpart.translate(
                                                    "showcases.htlc.expiration_period.two_days"
                                                )}
                                            </span>
                                            <span
                                                className={cnames(
                                                    "period-row",
                                                    {
                                                        "is-active":
                                                            this.state
                                                                .period ===
                                                            "one_week"
                                                    }
                                                )}
                                                onClick={() =>
                                                    this.setPeriod(7)
                                                }
                                            >
                                                {counterpart.translate(
                                                    "showcases.htlc.expiration_period.one_week"
                                                )}
                                            </span>
                                        </div>
                                    </div>
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
                                </div>
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
                    </div>
                </div>
            </Modal>
        );
    }
}

export default connect(
    HtlcModal,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {
                currentAccount: AccountStore.getState().currentAccount,
                passwordAccount: AccountStore.getState().passwordAccount
            };
        }
    }
);
