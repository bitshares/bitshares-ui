import React, {Component} from "react";
import Translate from "react-translate-component";
import {
    Input,
    Card,
    Col,
    Row,
    Button,
    Switch,
    Tooltip,
    Icon,
    Popover,
    Alert
} from "bitshares-ui-style-guide";
import AccountSelector from "../Account/AccountSelector";
import counterpart from "counterpart";
import AccountStore from "stores/AccountStore";
import {ChainStore} from "bitsharesjs";
import AmountSelector from "../Utility/AmountSelector";
import {Asset} from "common/MarketClasses";
import utils from "common/utils";
import {
    checkFeeStatusAsync,
    checkBalance,
    shouldPayFeeWithAssetAsync,
    estimateFeeAsync
} from "common/trxHelper";
import BalanceComponent from "../Utility/BalanceComponent";
import ApplicationApi from "../../api/ApplicationApi";
import {map} from "lodash-es";

function moveDecimal(num, decimals) {
    if (!num) return;
    return num / Math.pow(10, decimals);
}
export default class Barter extends Component {
    constructor() {
        super();
        this.state = {
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,
            from_barter: [
                {
                    index: 0,
                    from_amount: "",
                    from_asset_id: null,
                    from_asset: null,
                    from_feeAmount: new Asset({amount: 0}),
                    from_feeAsset: null,
                    from_fee_asset_id: null,
                    from_hasPoolBalance: null,
                    from_balanceError: false,
                    memo: ""
                }
            ],
            to_barter: [
                {
                    index: 0,
                    to_amount: "",
                    to_asset_id: null,
                    to_asset: null,
                    to_feeAmount: new Asset({amount: 0}),
                    to_feeAsset: null,
                    to_fee_asset_id: null,
                    to_hasPoolBalance: null,
                    to_balanceError: false,
                    memo: ""
                }
            ],
            amount_counter: [],
            amount_index: 0,
            from_error: null,
            to_error: null,
            memo: {
                from_barter: [{message: "", shown: false}],
                to_barter: [{message: "", shown: false}],
                escrow: [{message: "", shown: false}]
            },
            proposal_fee: 0,
            showEscrow: false,
            escrow_account_name: "",
            escrow_account: null,
            send_to_escrow: false,
            escrow_payment: 0,
            escrow_payment_changed: false,
            balanceWarning: {peer1: [], peer2: []}
        };
        this._checkBalance = this._checkBalance.bind(this);
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
    }

    componentWillMount() {
        let currentAccount = AccountStore.getState().currentAccount;
        if (!this.state.from_name) this.setState({from_name: currentAccount});
        estimateFeeAsync("proposal_create").then(fee => {
            this.setState({
                proposal_fee: new Asset({amount: fee}).getAmount({real: true})
            });
        });
        // for peer 1 and peer 2 there is also calculation of memo cost (no memo set atm)
        estimateFeeAsync("transfer").then(fee => {
            this.setState({
                transfer_fee: new Asset({amount: fee}).getAmount({real: true})
            });
        });
    }

    fromChanged(from_name) {
        this.setState({from_name});
    }

    escrowAccountChanged(escrow_account_name) {
        this.setState({escrow_account_name});
    }

    onFromAccountChanged(from_account) {
        this.setState({
            from_account,
            from_barter: [
                {
                    from_amount: "",
                    from_asset_id: null,
                    from_asset: null,
                    from_feeAmount: new Asset({amount: 0}),
                    from_feeAsset: null,
                    from_fee_asset_id: null,
                    from_hasPoolBalance: null,
                    from_balanceError: false
                }
            ]
        });
    }

    onEscrowAccountChanged(escrow_account) {
        this.setState({
            escrow_account
        });
    }

    toChanged(to_name) {
        this.setState({to_name});
    }

    onToAccountChanged(to_account) {
        this.setState({
            to_account,
            to_barter: [
                {
                    to_amount: "",
                    to_asset_id: null,
                    to_asset: null,
                    to_feeAmount: new Asset({amount: 0}),
                    to_feeAsset: null,
                    to_fee_asset_id: null,
                    to_hasPoolBalance: null,
                    to_balanceError: false
                }
            ]
        });
    }

    onFromAmountChanged(index, e) {
        const asset = e.asset;
        const amount = e.amount;
        if (!asset) {
            return;
        }
        let from_barter = [...this.state.from_barter];

        from_barter[index] = {
            index,
            from_amount: amount,
            from_asset: asset,
            from_asset_id: asset.get("id"),
            from_feeAmount: new Asset({amount: 0}),
            from_feeAsset: asset,
            from_fee_asset_id: "1.3.0",
            from_balanceError: false
        };

        this.setState(
            {
                from_barter: from_barter,
                from_error: null
            },
            () => {
                this._checkBalance(
                    from_barter[index].from_feeAmount,
                    amount,
                    this.state.from_account,
                    asset,
                    index,
                    true,
                    from_barter[index].from_fee_asset_id,
                    from_barter
                );
                this.checkAmountsTotal();
            }
        );
    }

    onToAmountChanged(index, e) {
        const asset = e.asset;
        const amount = e.amount;
        if (!asset) {
            return;
        }
        let to_barter = [...this.state.to_barter];

        to_barter[index] = {
            index,
            to_amount: amount,
            to_asset: asset,
            to_asset_id: asset.get("id"),
            to_feeAmount: new Asset({amount: 0}),
            to_feeAsset: asset,
            to_fee_asset_id: "1.3.0",
            to_balanceError: false
        };

        this.setState(
            {
                to_barter: to_barter,
                to_error: null
            },
            () => {
                this._checkBalance(
                    to_barter[index].to_feeAmount,
                    amount,
                    this.state.to_account,
                    asset,
                    index,
                    false,
                    to_barter[index].to_fee_asset_id,
                    to_barter
                );
                this.checkAmountsTotal();
            }
        );
    }

    _checkBalance(
        feeAmount,
        amount,
        account,
        asset,
        index,
        from,
        fee_asset_id,
        barter
    ) {
        if (!asset || !account) return;
        this._updateFee(
            fee_asset_id,
            account,
            asset.get("id"),
            index,
            from,
            barter
        );
        const balanceID = account.getIn(["balances", asset.get("id")]);
        const feeBalanceID = account.getIn(["balances", feeAmount.asset_id]);
        if (!asset || !account) return;
        if (!balanceID)
            if (from) {
                barter[index].from_balanceError = true;
                return this.setState({from_barter: barter});
            } else {
                barter[index].to_balanceError = true;
                return this.setState({to_barter: barter});
            }
        let balanceObject = ChainStore.getObject(balanceID);
        let feeBalanceObject = feeBalanceID
            ? ChainStore.getObject(feeBalanceID)
            : null;
        if (!feeBalanceObject || feeBalanceObject.get("balance") === 0) {
            if (from) {
                barter[index].from_fee_asset_id = "1.3.0";
                this.setState(
                    {from_barter: barter},
                    this._updateFee(
                        barter[index].from_fee_asset_id,
                        account,
                        asset.get("id"),
                        index,
                        from,
                        barter
                    )
                );
            } else {
                barter[index].to_fee_asset_id = "1.3.0";
                this.setState(
                    {to_barter: barter},
                    this._updateFee(
                        barter[index].to_fee_asset_id,
                        account,
                        asset.get("id"),
                        index,
                        from,
                        barter
                    )
                );
            }
        }
        if (!balanceObject || !feeAmount) return;
        if (!amount)
            if (from) {
                barter[index].from_balanceError = false;
                return this.setState({from_barter: barter});
            } else {
                barter[index].to_balanceError = false;
                return this.setState({to_barter: barter});
            }
        const hasBalance = checkBalance(
            amount,
            asset,
            feeAmount,
            balanceObject
        );

        if (hasBalance === null) return;
        if (from) {
            barter[index].from_balanceError = !hasBalance;
            return this.setState({from_barter: barter});
        } else {
            barter[index].to_balanceError = !hasBalance;
            return this.setState({to_barter: barter});
        }
    }

    _updateFee(fee_asset_id, account, asset_id, index, from, barter) {
        const {
            from_fee_asset_types,
            to_fee_asset_types
        } = this._getAvailableAssets(this.state);
        const fee_asset_types = from
            ? from_fee_asset_types
            : to_fee_asset_types;
        if (
            fee_asset_types.length === 1 &&
            fee_asset_types[0] !== fee_asset_id
        ) {
            fee_asset_id = fee_asset_types[0];
        }
        if (!account) return null;

        let memo_state = this.state.memo[from ? "from_barter" : "to_barter"][
            index
        ];

        let memo =
            !!memo_state && memo_state.shown && memo_state.message !== ""
                ? new Buffer(memo_state.message, "utf-8")
                : "";

        checkFeeStatusAsync({
            accountID: account.get("id"),
            feeID: fee_asset_id,
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content: memo
            }
        })
            .then(({fee, hasBalance, hasPoolBalance}) =>
                shouldPayFeeWithAssetAsync(account, fee).then(should => {
                    if (from) {
                        if (should) {
                            barter[index].from_fee_asset_id = asset_id;
                            this.setState({from_barter: barter});
                        } else {
                            barter[index].from_feeAmount = fee;
                            barter[index].from_fee_asset_id = fee.asset_id;
                            barter[index].from_hasPoolBalance = hasPoolBalance;
                            this.setState({
                                from_barter: barter,
                                from_error: !hasBalance || !hasPoolBalance
                            });
                        }
                    } else {
                        if (should) {
                            barter[index].to_fee_asset_id = asset_id;
                            this.setState({to_barter: barter});
                        } else {
                            barter[index].to_feeAmount = fee;
                            barter[index].to_fee_asset_id = fee.asset_id;
                            barter[index].to_hasPoolBalance = hasPoolBalance;
                            this.setState({
                                to_barter: barter,
                                to_error: !hasBalance || !hasPoolBalance
                            });
                        }
                    }
                })
            )
            .catch(err => {
                console.error(err);
            });
    }

    _getAvailableAssets(state = this.state) {
        const {from_account, from_error, to_account, to_error} = state;

        let getAssetTypes = (account, err) => {
            let asset_types = [],
                fee_asset_types = [];
            if (!(account && account.get("balances") && !err)) {
                return {asset_types, fee_asset_types};
            }
            let account_balances = account.get("balances").toJS();
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
        };

        let from = getAssetTypes(from_account, from_error);
        let to = getAssetTypes(to_account, to_error);

        return {
            from_asset_types: from.asset_types || [],
            to_asset_types: to.asset_types || [],
            from_fee_asset_types: from.fee_asset_types || [],
            to_fee_asset_types: to.fee_asset_types || []
        };
    }

    addFromAmount() {
        this.state.from_barter.push({
            from_amount: "",
            from_asset_id: null,
            from_asset: null,
            from_feeAmount: new Asset({amount: 0}),
            from_feeAsset: null,
            from_fee_asset_id: null
        });
        this.setState({from_barter: this.state.from_barter});
    }

    addToAmount() {
        this.state.to_barter.push({
            to_amount: "",
            to_asset_id: null,
            to_asset: null,
            to_feeAmount: new Asset({amount: 0}),
            to_feeAsset: null,
            to_fee_asset_id: null
        });
        this.setState({to_barter: this.state.to_barter});
    }

    onSubmit(e) {
        e.preventDefault();
        this.setState({from_error: null, to_error: null});
        let sendAmount;
        let transfer_list = [];

        let proposer = AccountStore.getState().currentAccount;

        let left_account = this.state.from_account;
        let escrowMemo =
            this.state.memo["escrow"][0] &&
            this.state.memo["escrow"][0].message;

        if (this.state.showEscrow && this.state.send_to_escrow) {
            left_account = this.state.escrow_account;
        }

        if (this.state.showEscrow) {
            let escrow_payment = this.state.escrow_payment_changed
                ? new Asset({real: this.state.escrow_payment}).getAmount()
                : fee(true);
            if (escrow_payment > 0) {
                transfer_list.push({
                    from_account: this.state.from_account.get("id"),
                    to_account: this.state.escrow_account.get("id"),
                    amount: escrow_payment,
                    asset: "1.3.0",
                    memo: escrowMemo ? new Buffer(escrowMemo, "utf-8") : null,
                    feeAsset: "1.3.0",
                    propose_account: proposer
                });
            }
        }

        this.state.from_barter.forEach((item, index) => {
            const asset = item.from_asset;
            let amount = item.from_amount;
            sendAmount = new Asset({
                real: amount,
                asset_id: asset.get("id"),
                precision: asset.get("precision")
            });

            let fromBarterMemo =
                this.state.memo["from_barter"][index] &&
                this.state.memo["from_barter"][index].message;

            if (this.state.showEscrow && this.state.send_to_escrow) {
                transfer_list.push({
                    from_account: this.state.from_account.get("id"),
                    to_account: this.state.escrow_account.get("id"),
                    amount: sendAmount.getAmount(),
                    asset: asset.get("id"),
                    memo: escrowMemo
                        ? new Buffer(escrowMemo, "utf-8")
                        : this.state.memo,
                    feeAsset: item.from_feeAsset
                        ? item.from_feeAsset.get("id")
                        : "1.3.0"
                });
            }

            transfer_list.push({
                from_account: left_account.get("id"),
                to_account: this.state.to_account.get("id"),
                amount: sendAmount.getAmount(),
                asset: asset.get("id"),
                memo: fromBarterMemo
                    ? new Buffer(fromBarterMemo, "utf-8")
                    : null,
                feeAsset: item.from_feeAsset
                    ? item.from_feeAsset.get("id")
                    : "1.3.0",
                propose_account: proposer
            });
        });

        if (this.state.showEscrow && !this.state.send_to_escrow) {
            transfer_list.push({
                from_account: this.state.escrow_account.get("id"),
                to_account: this.state.from_account.get("id"),
                amount: 1,
                asset: "1.3.0",
                memo: null,
                feeAsset: "1.3.0",
                propose_account: proposer
            });
        }

        this.state.to_barter.forEach((item, index) => {
            const asset = item.to_asset;
            let amount = item.to_amount;
            let toBarterMemo =
                this.state.memo["to_barter"][index] &&
                this.state.memo["to_barter"][index].message;
            sendAmount = new Asset({
                real: amount,
                asset_id: asset.get("id"),
                precision: asset.get("precision")
            });
            transfer_list.push({
                from_account: this.state.to_account.get("id"),
                to_account: this.state.from_account.get("id"),
                amount: sendAmount.getAmount(),
                asset: asset.get("id"),
                memo: toBarterMemo ? new Buffer(toBarterMemo, "utf-8") : null,
                feeAsset: item.to_feeAsset
                    ? item.to_feeAsset.get("id")
                    : "1.3.0",
                propose_account: proposer
            });
        });

        ApplicationApi.transfer_list(transfer_list);
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

    onMemoChanged = (type, index) => e => {
        const memos = Object.assign({}, this.state.memo);
        memos[type][index] = {message: e.target.value, shown: true};
        if (type === "from_barter") {
            let from_barter = this.state.from_barter;

            this.setState(
                {memo: memos},
                this._updateFee(
                    from_barter[index].from_fee_asset_id,
                    this.state.from_account,
                    from_barter[index].from_asset_id,
                    index,
                    true,
                    from_barter
                )
            );
        } else if (type === "to_barter") {
            let to_barter = this.state.to_barter;

            this.setState(
                {memo: memos},
                this._updateFee(
                    to_barter[index].to_fee_asset_id,
                    this.state.to_account,
                    to_barter[index].to_asset_id,
                    index,
                    false,
                    to_barter
                )
            );
        } else {
            this.setState({memo: memos});
        }
    };

    renderMemoField(type, index) {
        const {memo} = this.state;
        const memoValue =
            memo[type][index] && memo[type][index].message
                ? memo[type][index].message
                : "";
        return (
            <div className="content-block transfer-input">
                <Translate
                    className="left-label"
                    component="label"
                    content="transfer.memo"
                />
                <textarea
                    style={{marginBottom: 0}}
                    rows="1"
                    value={memoValue}
                    onChange={this.onMemoChanged(type, index)}
                />
            </div>
        );
    }

    handleMemoOpen = (type, index) => e => {
        const memos = Object.assign({}, this.state.memo);
        memos[type][index] = {shown: true};
        this.setState({memo: memos});
    };

    getBalance(account, assetType) {
        return ChainStore.getAccountBalance(account, assetType);
    }

    checkAmountsTotal() {
        const {from_barter, to_barter, from_account, to_account} = this.state;
        let peer1Amounts = {};
        let peer2Amounts = {};

        // for peer1
        from_barter.forEach(function(item) {
            if (item.from_amount) {
                if (peer1Amounts.hasOwnProperty(item.from_asset_id)) {
                    peer1Amounts[item.from_asset_id] = {
                        amount:
                            Number(peer1Amounts[item.from_asset_id].amount) +
                            Number(item.from_amount),
                        precision: item.from_asset.get("precision"),
                        symbol: item.from_asset.get("symbol")
                    };
                } else {
                    peer1Amounts[item.from_asset_id] = {
                        amount: Number(item.from_amount),
                        precision: item.from_asset.get("precision"),
                        symbol: item.from_asset.get("symbol")
                    };
                }
            }
        });

        let peer1AmountsFormated = map(peer1Amounts, (item, key) => {
            let balanceOfCurrentAsset = this.getBalance(from_account, key);
            let decimals = Math.max(0, item.precision);
            let formatedBalance = balanceOfCurrentAsset
                ? moveDecimal(balanceOfCurrentAsset, decimals)
                : 0;
            item.assetId = key;
            if (item.amount > formatedBalance) {
                item.warning = true;
                item.balance = formatedBalance;
            }
            return item;
        });

        // for peer2
        to_barter.forEach(function(item) {
            if (item.to_amount) {
                if (peer2Amounts.hasOwnProperty(item.to_asset_id)) {
                    peer2Amounts[item.to_asset_id] = {
                        amount:
                            Number(peer2Amounts[item.to_asset_id].amount) +
                            Number(item.to_amount),
                        precision: item.to_asset.get("precision"),
                        symbol: item.to_asset.get("symbol")
                    };
                } else {
                    peer2Amounts[item.to_asset_id] = {
                        amount: Number(item.to_amount),
                        precision: item.to_asset.get("precision"),
                        symbol: item.to_asset.get("symbol")
                    };
                }
            }
        });

        let peer2AmountsFormated = map(peer2Amounts, (item, key) => {
            let balanceOfCurrentAsset = this.getBalance(to_account, key);
            let decimals = Math.max(0, item.precision);
            let formatedBalance = balanceOfCurrentAsset
                ? moveDecimal(balanceOfCurrentAsset, decimals)
                : 0;
            item.assetId = key;
            if (item.amount > formatedBalance) {
                item.warning = true;
                item.balance = formatedBalance;
            }
            return item;
        });

        this.setState({
            balanceWarning: {
                peer1: peer1AmountsFormated,
                peer2: peer2AmountsFormated
            }
        });
    }

    renderBalanceWarnings() {
        const {
            balanceWarning: {peer1, peer2}
        } = this.state;
        let isPeer1Warning = peer1.some(item => !!item.warning);
        let isPeer2Warning = peer2.some(item => !!item.warning);

        let peer1Text = counterpart.translate("showcases.barter.peer_left");
        let peer2Text = counterpart.translate("showcases.barter.peer_right");
        let peer1Component = isPeer1Warning ? (
            <div style={{maxWidth: "25rem"}}>
                {counterpart.translate(
                    "showcases.barter.balance_warning_tooltip",
                    {
                        peer: peer1Text
                    }
                )}
                <br />
                {peer1.map(item => {
                    if (item.warning) {
                        return (
                            <React.Fragment>
                                <br />
                                <span
                                    style={{marginRight: "10px"}}
                                    key={item.assetId}
                                >
                                    {" - " +
                                        counterpart.translate(
                                            "showcases.barter.balance_warning_line",
                                            {
                                                asset_symbol: item.symbol,
                                                asset_balance: item.balance,
                                                asset_amount: item.amount
                                            }
                                        )}
                                </span>
                            </React.Fragment>
                        );
                    }
                })}
            </div>
        ) : null;
        let peer2Component = isPeer2Warning ? (
            <div style={{maxWidth: "25rem"}}>
                {counterpart.translate(
                    "showcases.barter.balance_warning_tooltip",
                    {
                        peer: peer2Text
                    }
                )}
                {peer2.map(item => {
                    if (item.warning) {
                        return (
                            <span
                                style={{marginRight: "10px"}}
                                key={item.assetId}
                            >
                                <br />
                                <br />
                                {counterpart.translate(
                                    "showcases.barter.balance_warning_line",
                                    {
                                        asset_symbol: item.symbol,
                                        asset_balance: item.balance,
                                        asset_amount: item.amount
                                    }
                                )}
                                ;
                            </span>
                        );
                    }
                })}
            </div>
        ) : null;

        return (
            <span className="barter-balance-warning">
                {isPeer1Warning && (
                    <Popover
                        content={peer1Component}
                        title={counterpart.translate(
                            "showcases.barter.balance_warning"
                        )}
                    >
                        <span style={{cursor: "help"}}>
                            <Alert
                                style={{
                                    display: "inline",
                                    marginRight: "1rem"
                                }}
                                message={
                                    peer1Text +
                                    " " +
                                    counterpart.translate(
                                        "showcases.barter.balance_warning"
                                    )
                                }
                                type="warning"
                                showIcon
                            />
                        </span>
                    </Popover>
                )}
                {isPeer2Warning && (
                    <Popover
                        content={peer2Component}
                        title={counterpart.translate(
                            "showcases.barter.balance_warning"
                        )}
                    >
                        <span style={{cursor: "help"}}>
                            <Alert
                                style={{display: "inline"}}
                                message={
                                    peer2Text +
                                    " " +
                                    counterpart.translate(
                                        "showcases.barter.balance_warning"
                                    )
                                }
                                type="warning"
                                showIcon
                            />
                        </span>
                    </Popover>
                )}
            </span>
        );
    }

    render() {
        let {
            from_name,
            to_name,
            from_account,
            to_account,
            from_barter,
            to_barter,
            amount_index,
            from_error,
            to_error
        } = this.state;
        let {from_asset_types, to_asset_types} = this._getAvailableAssets();
        let smallScreen = window.innerWidth < 850 ? true : false;
        let assetFromList = [];
        let assetToList = [];
        let assetFromSymbol = "";
        let assetToSymbol = "";

        const checkAmountValid = () => {
            for (let item of from_barter) {
                const amountValue = parseFloat(
                    String.prototype.replace.call(item.from_amount, /,/g, "")
                );
                if (isNaN(amountValue) || amountValue === 0) return false;
            }

            for (let item of to_barter) {
                const amountValue = parseFloat(
                    String.prototype.replace.call(item.to_amount, /,/g, "")
                );
                if (isNaN(amountValue) || amountValue === 0) return false;
            }
            return true;
        };
        const explictPrice = () => {
            let result = "";
            if (checkAmountValid()) {
                const fromAmount = parseFloat(from_barter[0].from_amount);
                const toAmount = parseFloat(to_barter[0].to_amount);
                result = fromAmount / toAmount;
            }
            return result;
        };

        const fee = from => {
            let fee = 0;
            if (from) {
                fee = fee;
                from_barter.forEach(item => {
                    fee += item.from_feeAmount.getAmount({real: true});
                });
            } else {
                to_barter.forEach(item => {
                    fee += item.to_feeAmount.getAmount({real: true});
                });
            }

            return fee;
        };
        const balanceError = () => {
            for (let item of from_barter) {
                if (item.from_balanceError) {
                    return true;
                }
            }
            for (let item of to_barter) {
                if (item.from_balanceError) {
                    return true;
                }
            }
            return false;
        };

        let isEscrowNotValid =
            this.state.showEscrow && !this.state.escrow_account;

        // should the user be only allowed to request for existing funds?
        // balanceError() ||
        const isSubmitNotValid =
            !from_account ||
            !to_account ||
            from_account.get("id") == to_account.get("id") ||
            to_error ||
            !checkAmountValid() ||
            from_error ||
            isEscrowNotValid;

        const balance = (account, balanceError, asset_types, asset) => {
            if (account && account.get("balances")) {
                let account_balances = account.get("balances").toJS();

                let _error = balanceError ? "has-error" : "";
                if (asset_types.length === 1)
                    asset = ChainStore.getAsset(asset_types[0]);
                if (asset_types.length > 0) {
                    let current_asset_id = asset
                        ? asset.get("id")
                        : asset_types[0];

                    return (
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
                            >
                                <BalanceComponent
                                    balance={account_balances[current_asset_id]}
                                />
                            </span>
                        </span>
                    );
                } else {
                    return (
                        <span>
                            <span className={_error}>
                                <Translate content="transfer.errors.noFunds" />
                            </span>
                        </span>
                    );
                }
            }
        };

        let fromAmountSelector = from_barter.map((item, index) => {
            let assetSymbol = "";
            if (item.from_asset) {
                assetSymbol = item.from_asset.get("symbol");
                assetFromList.push(
                    [item.from_amount || 0, assetSymbol].join(" ")
                );
            }

            let isMemoShown =
                this.state.memo["from_barter"][index] &&
                this.state.memo["from_barter"][index].shown;
            return (
                <div key={amount_index++}>
                    <div style={{position: "relative"}}>
                        {!isMemoShown && (
                            <Tooltip
                                title={counterpart.translate(
                                    "tooltip.add_memo_field"
                                )}
                                placement="topLeft"
                            >
                                <Button
                                    onClick={this.handleMemoOpen(
                                        "from_barter",
                                        index
                                    )}
                                    size="small"
                                    icon="message"
                                    className="add-memo-btn"
                                />
                            </Tooltip>
                        )}
                        <AmountSelector
                            label="showcases.barter.bartering_asset"
                            style={{
                                marginBottom: "1rem"
                            }}
                            amount={item.from_amount}
                            onChange={this.onFromAmountChanged.bind(
                                this,
                                index
                            )}
                            asset={
                                from_asset_types.length > 0 && item.from_asset
                                    ? item.from_asset.get("id")
                                    : item.from_asset_id
                                        ? item.from_asset_id
                                        : from_asset_types[0]
                            }
                            assets={from_asset_types}
                            display_balance={balance(
                                from_account,
                                item.from_balanceError,
                                from_asset_types,
                                item.from_asset
                            )}
                            allowNaN={true}
                        />
                    </div>
                    {isMemoShown && this.renderMemoField("from_barter", index)}
                </div>
            );

            assetFromSymbol = assetSymbol;
        });

        let toAmountSelector = to_barter.map((item, index) => {
            let assetSymbol = "";
            if (item.to_asset) {
                assetSymbol = item.to_asset.get("symbol");
                assetToList.push(
                    [item.to_amount || 0, item.to_asset.get("symbol")].join(" ")
                );
            }
            let isMemoShown =
                this.state.memo["to_barter"][index] &&
                this.state.memo["to_barter"][index].shown;

            return (
                <div key={amount_index++}>
                    <div style={{position: "relative"}}>
                        {!isMemoShown && (
                            <Tooltip
                                title={counterpart.translate(
                                    "tooltip.add_memo_field"
                                )}
                                placement="topLeft"
                            >
                                <Button
                                    onClick={this.handleMemoOpen(
                                        "to_barter",
                                        index
                                    )}
                                    size="small"
                                    icon="message"
                                    className="add-memo-btn"
                                />
                            </Tooltip>
                        )}
                        <AmountSelector
                            label="showcases.barter.bartering_asset"
                            style={{
                                marginBottom: "1rem"
                            }}
                            amount={item.to_amount}
                            onChange={this.onToAmountChanged.bind(this, index)}
                            asset={
                                to_asset_types.length > 0 && item.to_asset
                                    ? item.to_asset.get("id")
                                    : item.to_asset_id
                                        ? item.to_asset_id
                                        : to_asset_types[0]
                            }
                            assets={to_asset_types}
                            display_balance={balance(
                                to_account,
                                item.to_balanceError,
                                to_asset_types,
                                item.to_asset
                            )}
                            allowNaN={true}
                        />
                    </div>
                    {isMemoShown && this.renderMemoField("to_barter", index)}
                </div>
            );

            assetToSymbol = assetSymbol;
        });

        let account_from = (
            <Card style={{borderRadius: "10px"}}>
                <Translate content={"showcases.barter.peer_left"} />
                <AccountSelector
                    label="showcases.barter.account"
                    placeholder="placeholder"
                    style={{
                        marginTop: "0.5rem",
                        marginBottom: "1rem"
                    }}
                    allowPubKey={true}
                    allowUppercase={true}
                    account={from_account}
                    accountName={from_name}
                    onChange={this.fromChanged.bind(this)}
                    onAccountChanged={this.onFromAccountChanged.bind(this)}
                    hideImage
                    typeahead={true}
                />
                {from_account && (
                    <div>
                        {fromAmountSelector}
                        <div
                            style={{paddingTop: "10px", paddingBottom: "10px"}}
                        >
                            <Button
                                onClick={this.addFromAmount.bind(this)}
                                disabled={
                                    !from_account ||
                                    !this.state.from_barter[
                                        this.state.from_barter.length - 1
                                    ].from_amount
                                }
                            >
                                + Add asset
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        );

        let account_to = (
            <Card style={{borderRadius: "10px"}}>
                <Translate content={"showcases.barter.peer_right"} />
                <AccountSelector
                    label="showcases.barter.account"
                    placeholder="placeholder"
                    style={{
                        marginTop: "0.5rem",
                        marginBottom: "1rem"
                    }}
                    allowPubKey={true}
                    allowUppercase={true}
                    account={to_account}
                    accountName={to_name}
                    onChange={this.toChanged.bind(this)}
                    onAccountChanged={this.onToAccountChanged.bind(this)}
                    hideImage
                    typeahead={true}
                />
                {to_account && (
                    <div>
                        {toAmountSelector}
                        <div
                            style={{paddingTop: "10px", paddingBottom: "10px"}}
                        >
                            <Button
                                onClick={this.addToAmount.bind(this)}
                                disabled={
                                    !to_account ||
                                    !this.state.to_barter[
                                        this.state.to_barter.length - 1
                                    ].to_amount
                                }
                            >
                                + Add asset
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        );

        let action_error_key = "showcases.barter.not_complete";
        if (isSubmitNotValid) {
            if (!from_account) {
                action_error_key =
                    "showcases.barter.error_fill_in_peer_left_name";
            } else if (!to_account) {
                action_error_key =
                    "showcases.barter.error_fill_in_peer_right_name";
            } else if (from_account.get("id") == to_account.get("id")) {
                action_error_key = "showcases.barter.error_same_name";
            } else if (!checkAmountValid()) {
                action_error_key =
                    "showcases.barter.error_fill_in_valid_asset_amount";
            } else if (isEscrowNotValid) {
                action_error_key = "showcases.barter.error_fill_in_escrow_name";
            } else if (
                this.state.showEscrow &&
                (from_account.get("id") ==
                    this.state.escrow_account.get("id") ||
                    to_account.get("id") == this.state.escrow_account.get("id"))
            ) {
                action_error_key = "showcases.barter.error_same_name_escrow";
            }
        }

        let offers = (
            <Card style={{borderRadius: "10px"}}>
                {!isSubmitNotValid && (
                    <div className="left-label" style={{fontSize: "1rem"}}>
                        {counterpart.translate("showcases.barter.action", {
                            peer_left: from_name,
                            assets_left: assetFromList.join(", "),
                            peer_right: to_name,
                            assets_right: assetToList.join(", ")
                        })}
                        {this.state.showEscrow &&
                            !this.state.send_to_escrow &&
                            counterpart.translate(
                                "showcases.barter.escrow_as_witness",
                                {
                                    escrow: this.state.escrow_account.get(
                                        "name"
                                    )
                                }
                            )}
                        {this.state.showEscrow &&
                            this.state.send_to_escrow &&
                            counterpart.translate(
                                "showcases.barter.escrow_as_custodian",
                                {
                                    escrow: this.state.escrow_account.get(
                                        "name"
                                    )
                                }
                            )}
                    </div>
                )}
                {isSubmitNotValid && (
                    <div
                        className="left-label"
                        style={{
                            fontSize: "1rem"
                        }}
                    >
                        {counterpart.translate(action_error_key)}
                    </div>
                )}
                <Tooltip
                    title={counterpart.translate(
                        "showcases.barter.add_escrow_tooltip"
                    )}
                    placement="topRight"
                >
                    <Button
                        key={
                            this.state.showEscrow
                                ? "remove_escrow"
                                : "add_escrow"
                        }
                        onClick={this.toggleEscrow.bind(this)}
                        style={{
                            float: "right"
                        }}
                    >
                        {counterpart.translate(
                            this.state.showEscrow
                                ? "showcases.barter.remove_escrow"
                                : "showcases.barter.add_escrow"
                        )}
                    </Button>
                </Tooltip>
                {from_barter.length === 500 && to_barter.length === 500 ? ( // deactivate for now
                    <div className="amount-selector" style={this.props.style}>
                        <Translate
                            className="left-label"
                            component="label"
                            content="transfer.explict_price"
                        />
                        <div className="inline-label input-wrapper">
                            <Input
                                disabled={false}
                                type="text"
                                value={explictPrice()}
                            />

                            <div className="form-label select floating-dropdown">
                                <div className="dropdown-wrapper inactive">
                                    <div>
                                        {`${assetFromSymbol}/${assetToSymbol}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    ""
                )}
            </Card>
        );
        let addToExecutionFee = 0;
        // this.state.showEscrow &&
        // (this.state.escrow_payment_changed
        //     ? new Asset({real: this.state.escrow_payment}).getAmount()
        //     : fee(true)) > 0
        //     ? this.state.from_barter[0].from_feeAmount.getAmount({
        //           real: true
        //       })
        //     : 0;

        let totalFeeFrom = (
            <Card style={{borderRadius: "10px"}}>
                <Translate content={"showcases.barter.peer_left"} />
                <Tooltip
                    title={counterpart.translate(
                        this.state.send_to_escrow
                            ? "showcases.barter.fee_due_now_tooltip"
                            : "showcases.barter.fee_when_proposal_executes_tooltip"
                    )}
                >
                    <div>
                        {/*needed to render tooltip properly*/}
                        <AmountSelector
                            label={
                                this.state.send_to_escrow
                                    ? "showcases.barter.fee_due_now"
                                    : "showcases.barter.fee_when_proposal_executes"
                            }
                            disabled={true}
                            style={{
                                marginTop: "0.5rem",
                                marginBottom: "1rem"
                            }}
                            amount={fee(true) + addToExecutionFee}
                            asset={"1.3.0"}
                            assets={["1.3.0"]}
                            error={
                                this.state.hasPoolBalance === false
                                    ? "transfer.errors.insufficient"
                                    : null
                            }
                            scroll_length={2}
                        />
                    </div>
                </Tooltip>
                <Tooltip
                    title={counterpart.translate(
                        "showcases.barter.proposal_fee_tooltip"
                    )}
                >
                    <div>
                        {/*needed to render tooltip properly*/}
                        <AmountSelector
                            label="showcases.barter.proposal_fee"
                            disabled={true}
                            amount={this.state.proposal_fee}
                            style={{
                                marginBottom: "1rem"
                            }}
                            asset={"1.3.0"}
                            assets={["1.3.0"]}
                            error={
                                this.state.hasPoolBalance === false
                                    ? "transfer.errors.insufficient"
                                    : null
                            }
                            scroll_length={2}
                        />
                    </div>
                </Tooltip>
                <Tooltip
                    title={counterpart.translate(
                        "showcases.barter.total_fees_tooltip"
                    )}
                >
                    <span style={{marginTop: "1rem"}}>
                        <Translate
                            content={"showcases.barter.total_fees"}
                            className="left-label"
                            component="label"
                            fee={fee(true) + this.state.proposal_fee}
                            asset={"BTS"}
                        />
                    </span>
                </Tooltip>
            </Card>
        );

        let totalFeeTo = (
            <Card style={{borderRadius: "10px"}}>
                <Translate content={"showcases.barter.peer_right"} />
                <Tooltip
                    title={counterpart.translate(
                        "showcases.barter.fee_when_proposal_executes_tooltip"
                    )}
                >
                    <div>
                        {/*needed to render tooltip properly*/}
                        <AmountSelector
                            label="showcases.barter.fee_when_proposal_executes"
                            disabled={true}
                            amount={fee(false)}
                            style={{
                                marginTop: "0.5rem"
                            }}
                            asset={"1.3.0"}
                            assets={["1.3.0"]}
                            error={
                                this.state.hasPoolBalance === false
                                    ? "transfer.errors.insufficient"
                                    : null
                            }
                            scroll_length={2}
                        />
                    </div>
                </Tooltip>
            </Card>
        );

        let feeForEscrow = null;
        if (this.state.showEscrow) {
            feeForEscrow = (
                <Card style={{borderRadius: "10px"}}>
                    <Translate content={"showcases.barter.escrow_account"} />
                    <Tooltip
                        title={counterpart.translate(
                            "showcases.barter.fee_when_proposal_executes_tooltip"
                        )}
                    >
                        <div>
                            {/*needed to render tooltip properly*/}
                            <AmountSelector
                                label="showcases.barter.fee_when_proposal_executes"
                                disabled={false}
                                amount={fee(true)}
                                style={{
                                    marginTop: "0.5rem"
                                }}
                                asset={"1.3.0"}
                                assets={["1.3.0"]}
                                error={
                                    this.state.hasPoolBalance === false
                                        ? "transfer.errors.insufficient"
                                        : null
                                }
                                scroll_length={2}
                            />
                        </div>
                    </Tooltip>
                </Card>
            );
        }

        let intro = (
            <Card
                style={{
                    borderRadius: "10px"
                }}
            >
                <Tooltip
                    title={counterpart.translate(
                        "showcases.barter.new_barter_tooltip"
                    )}
                    placement="bottom"
                >
                    <h2 style={{textAlign: "center"}}>
                        <Translate content={"showcases.barter.new_barter"} />{" "}
                        <Icon type="question-circle" theme="filled" />
                    </h2>
                </Tooltip>
            </Card>
        );

        let escrow = null;
        let isEscrowMemoShown =
            this.state.memo["escrow"][0] && this.state.memo["escrow"][0].shown;
        let escrow_payment = this.state.escrow_payment_changed
            ? this.state.escrow_payment
            : fee(true);
        if (this.state.showEscrow) {
            escrow = (
                <Card style={{borderRadius: "10px"}}>
                    <AccountSelector
                        label="showcases.barter.escrow_account"
                        placeholder="placeholder"
                        style={{
                            marginBottom: "1rem"
                        }}
                        allowPubKey={true}
                        allowUppercase={true}
                        account={this.state.escrow_account}
                        accountName={this.state.escrow_account_name}
                        onChange={this.escrowAccountChanged.bind(this)}
                        onAccountChanged={this.onEscrowAccountChanged.bind(
                            this
                        )}
                        hideImage
                        typeahead={true}
                    />
                    <Tooltip
                        title={counterpart.translate(
                            "showcases.barter.send_to_escrow_tooltip"
                        )}
                    >
                        <span>
                            <Switch
                                style={{margin: 6}}
                                checked={this.state.send_to_escrow}
                                onChange={this.onToggleSendToEscrow.bind(this)}
                            />
                            <Translate content="showcases.barter.send_to_escrow" />
                        </span>
                    </Tooltip>

                    <div style={{position: "relative"}}>
                        {!isEscrowMemoShown && (
                            <Tooltip
                                title={counterpart.translate(
                                    "tooltip.add_memo_field"
                                )}
                                placement="topLeft"
                            >
                                <Button
                                    onClick={this.handleMemoOpen("escrow", 0)}
                                    size="small"
                                    icon="message"
                                    className="add-memo-btn"
                                />
                            </Tooltip>
                        )}

                        <Tooltip
                            title={counterpart.translate(
                                "showcases.barter.escrow_payment_tooltip"
                            )}
                            placement="topLeft"
                        >
                            <div>
                                {/*needed to render tooltip properly*/}
                                <AmountSelector
                                    label="showcases.barter.escrow_payment"
                                    disabled={false}
                                    amount={escrow_payment}
                                    onChange={this._updateEscrowFee.bind(this)}
                                    style={{
                                        margin: "1rem 0"
                                    }}
                                    asset={"1.3.0"}
                                    assets={["1.3.0"]}
                                    error={
                                        this.state.hasPoolBalance === false
                                            ? "transfer.errors.insufficient"
                                            : null
                                    }
                                    scroll_length={2}
                                />
                            </div>
                        </Tooltip>
                        {isEscrowMemoShown && this.renderMemoField("escrow", 0)}
                    </div>
                </Card>
            );
        }

        return (
            <div
                className="center"
                style={{
                    padding: "10px",
                    maxWidth: "80rem",
                    width: "100%",
                    margin: "0 auto"
                }}
            >
                <Card>
                    {smallScreen ? (
                        <div>
                            <Row>
                                <Col style={{padding: "10px"}}>{intro}</Col>
                            </Row>
                            <Row>
                                <Col style={{padding: "10px"}}>
                                    {account_from}
                                </Col>
                            </Row>
                            <Row>
                                <Col style={{padding: "10px"}}>
                                    {account_to}
                                </Col>
                            </Row>
                            <Row>
                                <Col style={{padding: "10px"}}>{offers}</Col>
                            </Row>
                            {escrow && (
                                <Row>
                                    <Col style={{padding: "10px"}}>
                                        {escrow}
                                    </Col>
                                </Row>
                            )}
                            <Row>
                                <Col style={{padding: "10px"}}>
                                    {totalFeeFrom}
                                </Col>
                            </Row>
                            <Row>
                                <Col style={{padding: "10px"}}>
                                    {totalFeeTo}
                                </Col>
                            </Row>
                            {feeForEscrow != null && (
                                <Row>
                                    <Col style={{padding: "10px"}}>
                                        {feeForEscrow}
                                    </Col>
                                </Row>
                            )}
                        </div>
                    ) : (
                        <div>
                            <Row>
                                <Col style={{padding: "10px"}}>{intro}</Col>
                            </Row>
                            <Row>
                                <Col span={12} style={{padding: "10px"}}>
                                    {account_from}
                                </Col>
                                <Col span={12} style={{padding: "10px"}}>
                                    {account_to}
                                </Col>
                            </Row>
                            <Row>
                                <Col style={{padding: "10px"}}>{offers}</Col>
                            </Row>
                            {escrow && (
                                <Row>
                                    <Col style={{padding: "10px"}}>
                                        {escrow}
                                    </Col>
                                </Row>
                            )}
                            <Row>
                                <Col span={12} style={{padding: "10px"}}>
                                    {totalFeeFrom}
                                </Col>
                                <Col span={12} style={{padding: "10px"}}>
                                    {totalFeeTo}
                                    {feeForEscrow}
                                </Col>
                            </Row>
                        </div>
                    )}
                    <div className="barter-footer">
                        <Tooltip
                            title={counterpart.translate(
                                "showcases.barter.propose_tooltip"
                            )}
                            placement="topLeft"
                        >
                            <Button
                                key={"propose"}
                                disabled={isSubmitNotValid}
                                onClick={
                                    !isSubmitNotValid
                                        ? this.onSubmit.bind(this)
                                        : null
                                }
                            >
                                {counterpart.translate("propose")}
                            </Button>
                        </Tooltip>
                        {!isSubmitNotValid && this.renderBalanceWarnings()}
                    </div>
                </Card>
            </div>
        );
    }

    _updateEscrowFee(e) {
        this.setState({
            escrow_payment_changed: true,
            escrow_payment: e.amount
        });
    }

    onToggleSendToEscrow() {
        this.setState({
            send_to_escrow: !this.state.send_to_escrow
        });
    }

    toggleEscrow() {
        this.setState({showEscrow: !this.state.showEscrow});
    }
}
