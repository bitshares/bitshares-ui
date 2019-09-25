import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import {ChainStore} from "tuscjs";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
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
import AccountActions from "actions/AccountActions";
import utils from "common/utils";
import counterpart from "counterpart";
import {connect} from "alt-react";
import {getWalletName} from "branding";
import {Form, Modal, Button, Tooltip, Input} from "bitshares-ui-style-guide";

const EqualWidthContainer = ({children}) => (
    <div
        style={{
            display: "flex",
            justifyContent: "center"
        }}
    >
        <div
            style={{
                display: "grid",
                gridTemplateColumns: children.map(() => "1fr").join(" ")
            }}
        >
            {children}
        </div>
    </div>
);

class SendModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this.nestedRef = null;

        this.onTrxIncluded = this.onTrxIncluded.bind(this);

        this._updateFee = debounce(this._updateFee.bind(this), 250);
        this._checkFeeStatus = this._checkFeeStatus.bind(this);
        this._checkBalance = this._checkBalance.bind(this);

        ZfApi.subscribe("transaction_confirm_actions", (name, msg) => {
            if (msg == "close") {
                this.setState({hidden: false});
                this.hideModal();
            }
        });

        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    showModal() {
        this.setState({
            isModalVisible: true
        });
    }

    hideModal() {
        this.setState({
            isModalVisible: false
        });
    }

    getInitialState() {
        return {
            isModalVisible: false,
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,
            orig_account: null,
            amount: "",
            asset_id: null,
            asset: null,
            memo: "",
            error: null,
            knownScammer: null,
            propose: false,
            propose_account: "",
            feeAsset: null,
            fee_asset_id: "1.3.0",
            feeAmount: new Asset({amount: 0}),
            feeStatus: {},
            maxAmount: false,
            hidden: false
        };
    }

    show() {
        this.setState({open: true, hidden: false}, () => {
            this.showModal();
            this._initForm();
        });
    }

    onClose(publishClose = true) {
        ZfApi.unsubscribe("transaction_confirm_actions");
        this.setState(
            {
                open: false,
                from_name: "",
                to_name: "",
                from_account: null,
                to_account: null,
                orig_account: null,
                amount: "",
                asset_id: null,
                asset: null,
                memo: "",
                error: null,
                knownScammer: null,
                propose: false,
                propose_account: "",
                feeAsset: null,
                fee_asset_id: "1.3.0",
                feeAmount: new Asset({amount: 0}),
                feeStatus: {},
                maxAmount: false,
                hidden: false
            },
            () => {
                if (publishClose) this.hideModal();
            }
        );
    }

    onSubmit(e) {
        e.preventDefault();
        this.setState({error: null});

        const {asset} = this.state;
        let {amount} = this.state;
        const sendAmount = new Asset({
            real: amount,
            asset_id: asset.get("id"),
            precision: asset.get("precision")
        });

        this.setState({hidden: true});

        AccountActions.transfer(
            this.state.from_account.get("id"),
            this.state.to_account.get("id"),
            sendAmount.getAmount(),
            asset.get("id"),
            this.state.memo
                ? new Buffer(this.state.memo, "utf-8")
                : this.state.memo,
            this.state.propose ? this.state.propose_account : null,
            this.state.feeAsset ? this.state.feeAsset.get("id") : "1.3.0"
        )
            .then(() => {
                this.onClose();
                TransactionConfirmStore.unlisten(this.onTrxIncluded);
                TransactionConfirmStore.listen(this.onTrxIncluded);
            })
            .catch(e => {
                let msg = e.message
                    ? e.message.split("\n")[1] || e.message
                    : null;
                console.log("error: ", e, msg);
                this.setState({error: msg});
            });
    }

    _initForm() {
        if (this.props.to_name != this.props.from_name) {
            this.setState({
                to_name: this.props.to_name,
                to_account: ChainStore.getAccount(this.props.to_name)
            });
        }

        if (this.props.from_name) {
            this.setState({
                from_name: this.props.from_name,
                from_account: ChainStore.getAccount(this.props.from_name)
            });
        }

        let {currentAccount} = this.props;
        if (!this.state.from_name) {
            this.setState({from_name: currentAccount});
        }

        if (
            this.props.asset_id &&
            this.state.asset_id !== this.props.asset_id
        ) {
            let asset = ChainStore.getAsset(this.props.asset_id);
            if (asset) {
                this.setState({
                    asset_id: this.props.asset_id,
                    asset
                });
            }
        }
    }

    shouldComponentUpdate(np, ns) {
        let {asset_types: current_types} = this._getAvailableAssets();
        let {asset_types: next_asset_types} = this._getAvailableAssets(ns);

        if (next_asset_types.length === 1) {
            let asset = ChainStore.getAsset(next_asset_types[0]);
            if (current_types.length !== 1) {
                this.onAmountChanged({amount: ns.amount, asset});
            }

            if (next_asset_types[0] !== this.state.fee_asset_id) {
                if (asset && this.state.fee_asset_id !== next_asset_types[0]) {
                    this.setState({
                        feeAsset: asset,
                        fee_asset_id: next_asset_types[0]
                    });
                }
            }
        }

        if (ns.open && !this.state.open) this._checkFeeStatus(ns);
        if (!ns.open && !this.state.open) return false;
        return true;
    }

    componentWillReceiveProps(np) {
        if (
            np.currentAccount !== this.state.from_name &&
            np.currentAccount !== this.props.currentAccount
        ) {
            this.setState(
                {
                    from_name: np.from_name,
                    from_account: ChainStore.getAccount(np.from_name),
                    to_name: np.to_name ? np.to_name : "",
                    to_account: np.to_name
                        ? ChainStore.getAccount(np.to_name)
                        : null,
                    feeStatus: {},
                    fee_asset_id: "1.3.0",
                    feeAmount: new Asset({amount: 0})
                },
                () => {
                    this._updateFee();
                    this._checkFeeStatus();
                }
            );
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
        let {from_account, open} = state;
        if (!from_account || !open) return;

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
                    options: ["price_per_kbyte"],
                    data: {
                        type: "memo",
                        content: this.state.memo
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

        const {from_account, from_error} = state;
        let asset_types = [],
            fee_asset_types = [];
        if (!(from_account && from_account.get("balances") && !from_error)) {
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
        if (!state.open) return;
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
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content: state.memo
            }
        }).then(({fee, hasBalance, hasPoolBalance}) =>
            shouldPayFeeWithAssetAsync(from_account, fee).then(should =>
                should
                    ? this.setState(
                          {
                              fee_asset_id: asset_id
                          },
                          this._updateFee
                      )
                    : this.setState({
                          feeAmount: fee,
                          fee_asset_id: fee.asset_id,
                          hasBalance,
                          hasPoolBalance,
                          error: !hasBalance || !hasPoolBalance
                      })
            )
        );
    }

    setNestedRef(ref) {
        this.nestedRef = ref;
    }

    toChanged(to_name) {
        this.setState({to_name, error: null});
    }

    fromChanged(from_name) {
        this.setState({from_name});
    }

    onFromAccountChanged(from_account) {
        this.setState({from_account});
    }

    onToAccountChanged(to_account) {
        this.setState({to_account, error: null});
    }

    onAmountChanged({amount, asset}) {
        if (!asset) return;

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
    }

    onFeeChanged({asset}) {
        if (!asset) return;

        if (typeof asset !== "object") {
            asset = ChainStore.getAsset(asset);
        }

        this.setState(
            {
                feeAsset: asset,
                fee_asset_id: asset.get("id"),
                error: null
            },
            this._updateFee
        );
    }

    onMemoChanged(e) {
        let {asset_types} = this._getAvailableAssets();
        let {from_account, from_error, maxAmount} = this.state;
        if (
            from_account &&
            from_account.get("balances") &&
            !from_error &&
            maxAmount
        ) {
            let account_balances = from_account.get("balances").toJS();
            let current_asset_id = asset_types[0];
            this._setTotal(
                current_asset_id,
                account_balances[current_asset_id]
            );
        }
        this.setState({memo: e.target.value}, this._updateFee);
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

    onPropose = () => {
        let {
            propose,
            orig_account,
            to_account,
            to_name,
            from_account,
            from_name
        } = this.state;

        // Store Original Account
        if (!propose) {
            this.setState({orig_account: from_account});
        }

        // ReStore Original Account
        if (propose) {
            from_account = orig_account;
            from_name = orig_account.get("name");
        }

        // toggle switch
        propose = propose ? false : true;

        this.setState({
            propose,
            propose_account: propose ? from_account : null,
            from_account: propose ? null : from_account,
            from_name: propose ? "" : from_name
        });
    };

    onProposeAccount(propose_account) {
        this.setState({propose_account});
    }

    render() {
        let {
            propose,
            from_account,
            to_account,
            asset,
            asset_id,
            propose_account,
            feeAmount,
            amount,
            error,
            to_name,
            from_name,
            memo,
            feeAsset,
            fee_asset_id,
            balanceError,
            hidden
        } = this.state;
        let from_my_account =
            AccountStore.isMyAccount(from_account) ||
            from_name === this.props.passwordAccount;
        let from_error =
            from_account && !from_my_account && !propose ? true : false;
        let {asset_types, fee_asset_types} = this._getAvailableAssets();
        let balance = null;
        let balance_fee = null;

        // Estimate fee
        let fee = this.state.feeAmount.getAmount({real: true});
        if (from_account && from_account.get("balances") && !from_error) {
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

        let propose_incomplete = propose && !propose_account;
        const amountValue = parseFloat(
            String.prototype.replace.call(amount, /,/g, "")
        );
        const isAmountValid = amountValue && !isNaN(amountValue);
        const isSubmitNotValid =
            !from_account ||
            !to_account ||
            !isAmountValid ||
            !asset ||
            from_error ||
            propose_incomplete ||
            balanceError ||
            from_account.get("id") == to_account.get("id");

        let tabIndex = this.props.tabIndex; // Continue tabIndex on props count

        return !this.state.open ? null : (
            <div
                id="send_modal_wrapper"
                className={hidden || !this.state.open ? "hide" : ""}
            >
                <Modal
                    visible={this.state.isModalVisible}
                    id={this.props.id}
                    overlay={true}
                    onCancel={this.hideModal}
                    footer={[
                        <Button
                            key={"send"}
                            disabled={isSubmitNotValid}
                            onClick={
                                !isSubmitNotValid
                                    ? this.onSubmit.bind(this)
                                    : null
                            }
                        >
                            {propose
                                ? counterpart.translate("propose")
                                : counterpart.translate("transfer.send")}
                        </Button>,
                        <Button
                            key="Cancel"
                            tabIndex={tabIndex++}
                            onClick={this.onClose}
                        >
                            <Translate
                                component="span"
                                content="transfer.cancel"
                            />
                        </Button>
                    ]}
                >
                    <div className="grid-block vertical no-overflow">
                        <div className="content-block">
                            <EqualWidthContainer>
                                <Button
                                    type={propose ? "ghost" : "primary"}
                                    onClick={this.onPropose}
                                >
                                    <Translate content="transfer.send" />
                                </Button>
                                <Button
                                    type={propose ? "primary" : "ghost"}
                                    onClick={this.onPropose}
                                >
                                    <Translate content="propose" />
                                </Button>
                            </EqualWidthContainer>
                        </div>
                        <div
                            className="content-block"
                            style={{textAlign: "center"}}
                        >
                            <Translate
                                content={
                                    propose
                                        ? "transfer.header_subheader_propose"
                                        : "transfer.header_subheader"
                                }
                                wallet_name={getWalletName()}
                            />
                        </div>
                        {this.state.open ? (
                            <Form className="full-width" layout="vertical">
                                {!!propose && (
                                    <React.Fragment>
                                        <AccountSelector
                                            label="transfer.by"
                                            accountName={
                                                this.props.currentAccount
                                            }
                                            account={this.props.currentAccount}
                                            size={35}
                                            typeahead={true}
                                            tabIndex={tabIndex++}
                                            locked={true}
                                        />
                                        <div className="modal-separator" />
                                    </React.Fragment>
                                )}

                                <AccountSelector
                                    label="transfer.from"
                                    accountName={from_name}
                                    account={from_account}
                                    onChange={this.fromChanged.bind(this)}
                                    onAccountChanged={this.onFromAccountChanged.bind(
                                        this
                                    )}
                                    size={35}
                                    typeahead={true}
                                    tabIndex={tabIndex++}
                                    locked={!!propose ? undefined : true}
                                />

                                <AccountSelector
                                    label="transfer.to"
                                    accountName={to_name}
                                    account={to_account}
                                    onChange={this.toChanged.bind(this)}
                                    onAccountChanged={this.onToAccountChanged.bind(
                                        this
                                    )}
                                    size={35}
                                    typeahead={true}
                                    tabIndex={tabIndex++}
                                />

                                <AmountSelector
                                    label="transfer.amount"
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
                                    display_balance={balance}
                                    tabIndex={tabIndex++}
                                    allowNaN={true}
                                />
                                {memo && memo.length ? (
                                    <label className="right-label">
                                        {memo.length}
                                    </label>
                                ) : null}
                                <Form.Item
                                    label={counterpart.translate(
                                        "transfer.memo"
                                    )}
                                    validateStatus={
                                        memo && propose ? "warning" : ""
                                    }
                                    help={
                                        memo && propose
                                            ? counterpart.translate(
                                                  "transfer.warn_name_unable_read_memo"
                                              )
                                            : ""
                                    }
                                >
                                    <Tooltip
                                        placement="top"
                                        title={counterpart.translate(
                                            "tooltip.memo_tip"
                                        )}
                                    >
                                        <Input.TextArea
                                            style={{marginBottom: 0}}
                                            rows={3}
                                            value={memo}
                                            tabIndex={tabIndex++}
                                            onChange={this.onMemoChanged.bind(
                                                this
                                            )}
                                        />
                                    </Tooltip>
                                </Form.Item>

                                <AmountSelector
                                    label="transfer.fee"
                                    disabled={true}
                                    amount={fee}
                                    onChange={this.onFeeChanged.bind(this)}
                                    asset={
                                        fee_asset_types.length && feeAmount
                                            ? feeAmount.asset_id
                                            : fee_asset_types.length === 1
                                            ? fee_asset_types[0]
                                            : fee_asset_id
                                            ? fee_asset_id
                                            : fee_asset_types[0]
                                    }
                                    assets={fee_asset_types}
                                    display_balance={balance_fee}
                                    tabIndex={tabIndex++}
                                    error={
                                        this.state.hasPoolBalance === false
                                            ? "transfer.errors.insufficient"
                                            : null
                                    }
                                    scroll_length={2}
                                />
                            </Form>
                        ) : null}
                    </div>
                </Modal>
            </div>
        );
    }
}

class SendModalConnectWrapper extends React.Component {
    render() {
        return <SendModal {...this.props} ref={this.props.refCallback} />;
    }
}

SendModalConnectWrapper = connect(
    SendModalConnectWrapper,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps(props) {
            return {
                currentAccount: AccountStore.getState().currentAccount,
                passwordAccount: AccountStore.getState().passwordAccount,
                tabIndex: props.tabIndex || 0
            };
        }
    }
);

export default SendModalConnectWrapper;
