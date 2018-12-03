import React, {Component} from "react";
import Translate from "react-translate-component";
import {Input, Card, Col, Row, Button} from "bitshares-ui-style-guide";
import AccountSelector from "../Account/AccountSelector";
import counterpart from "counterpart";
import AccountStore from "stores/AccountStore";
import {ChainStore} from "bitsharesjs";
import SettingsStore from "stores/SettingsStore";
import AssetStore from "stores/AssetStore";
import debounceRender from "react-debounce-render";
import {connect} from "alt-react";
import MarketsStore from "stores/MarketsStore";
import AmountSelector from "../Utility/AmountSelector";
import {Asset} from "common/MarketClasses";
import utils from "common/utils";
import {
    checkFeeStatusAsync,
    checkBalance,
    shouldPayFeeWithAssetAsync
} from "common/trxHelper";
import BalanceComponent from "../Utility/BalanceComponent";
import AccountActions from "actions/AccountActions";

class Barter extends Component {
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
                    from_asset: null
                }
            ],
            to_barter: [
                {
                    index: 0,
                    to_amount: "",
                    to_asset_id: null,
                    to_asset: null
                }
            ],
            from_feeAmount: new Asset({amount: 0}),
            from_feeStatus: {},
            from_feeAsset: null,
            to_feeAmount: new Asset({amount: 0}),
            to_feeStatus: {},
            to_feeAsset: null,
            amount_counter: [],
            amount_index: 0,
            error: null,
            memo: "Barter"
        };
        this._checkBalance = this._checkBalance.bind(this);
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
    }

    componentWillMount() {
        let currentAccount = AccountStore.getState().currentAccount;
        if (!this.state.from_name) this.setState({from_name: currentAccount});
    }

    fromChanged(from_name) {
        this.setState({from_name});
    }

    onFromAccountChanged(from_account) {
        this.setState({from_account});
    }

    toChanged(to_name) {
        this.setState({to_name});
    }

    onToAccountChanged(to_account) {
        this.setState({to_account});
    }
    onFromAmountChanged(e, index) {
        const asset = e.asset;
        const amount = e.amount;
        if (!asset) {
            return;
        }
        let from_barter = this.state.from_barter;

        from_barter[index] = {
            index,
            from_amount: amount,
            from_asset: asset,
            from_asset_id: asset.get("id"),
            error: null,
            maxAmount: false
        };

        this.setState(
            {
                from_barter
            },
            this._checkBalance
        );
    }
    onToAmountChanged(e, index) {
        const asset = e.asset;
        const amount = e.amount;
        if (!asset) {
            return;
        }
        let to_barter = this.state.to_barter;

        to_barter[index] = {
            index,
            to_amount: amount,
            to_asset: asset,
            to_asset_id: asset.get("id"),
            error: null,
            maxAmount: false
        };

        this.setState(
            {
                to_barter
            },
            this._checkBalance
        );
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
    _getAvailableAssets(state = this.state) {
        const {from_feeStatus, to_feeStatus} = this.state;
        function hasFeePoolBalance(feeStatus) {
            if (feeStatus === undefined) return true;
            return feeStatus && feeStatus.hasPoolBalance;
        }

        function hasBalance(feeStatus) {
            if (feeStatus === undefined) return true;
            return feeStatus && feeStatus.hasBalance;
        }

        const {from_account, from_error, to_account, to_error} = state;

        let getAssetTypes = (account, feeStatus, err) => {
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
            fee_asset_types = fee_asset_types.filter(id => {
                return (
                    hasFeePoolBalance(feeStatus[id]) &&
                    hasBalance(feeStatus[id])
                );
            });

            return {asset_types, fee_asset_types};
        };

        let from = getAssetTypes(from_account, from_feeStatus, from_error);
        let to = getAssetTypes(to_account, to_feeStatus, to_error);

        return {
            from_asset_types: from.asset_types || [],
            to_asset_types: to.asset_types || [],
            from_fee_asset_types: from.asset_fee_types || [],
            to_fee_asset_types: to.fee_asset_types || []
        };
    }

    addFromAmount() {
        this.state.from_barter.push("");
        this.setState({from_barter: this.state.from_barter});
    }

    addToAmount() {
        this.state.to_barter.push("");
        this.setState({to_barter: this.state.to_barter});
    }

    onSubmit(e) {
        e.preventDefault();
        this.setState({error: null});
        let sendAmount;

        this.state.from_barter.forEach(item => {
            const asset = item.from_asset;
            let amount = item.from_amount;
            sendAmount = new Asset({
                real: amount,
                asset_id: asset.get("id"),
                precision: asset.get("precision")
            });
        });
        AccountActions.transfer(
            this.state.from_account.get("id"),
            this.state.to_account.get("id"),
            sendAmount.getAmount(),
            asset.get("id"),
            this.state.memo
                ? new Buffer(this.state.memo, "utf-8")
                : this.state.memo,
            this.state.from_account, //  propose
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

    render() {
        let {
            from_name,
            to_name,
            from_account,
            to_account,
            from_feeAsset,
            to_feeAsset,
            from_feeAmount,
            to_feeAmount,
            from_balanceError,
            to_balanceError,
            from_barter,
            to_barter,
            amount_index
        } = this.state;
        let {from_asset_types, to_asset_types} = this._getAvailableAssets();
        let smallScreen = window.innerWidth < 850 ? true : false;
        let asset;
        //let defaultBases = this.props.preferredBases.map(a => a);
        let from_balance = null;
        let to_balance = null;
        let from_balance_fee = null;
        let to_balance_fee = null;

        const isSubmitNotValid =
            !from_account ||
            !to_account ||
            from_account.get("id") == to_account.get("id");

        let balance = (
            feeAmount,
            feeAsset,
            account,
            balanceError,
            asset_types
        ) => {
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
            if (index === 0) return;
            return (
                <AmountSelector
                    label="showcases.barter.title"
                    key={amount_index++}
                    amount={item.from_amount}
                    onChange={e => this.onFromAmountChanged(e, index++)}
                    asset={
                        from_asset_types.length > 0 && item.from_asset
                            ? item.from_asset.get("id")
                            : item.from_asset_id
                                ? item.from_asset_id
                                : from_asset_types[0]
                    }
                    assets={from_asset_types}
                    display_balance={balance(
                        from_feeAmount,
                        from_feeAsset,
                        from_account,
                        from_balanceError,
                        from_asset_types
                    )}
                    allowNaN={true}
                />
            );
        });
        let toAmountSelector = to_barter.map((item, index) => {
            if (index === 0) return;
            return (
                <AmountSelector
                    label="showcases.barter.title"
                    key={amount_index++}
                    amount={item.to_amount}
                    onChange={e => this.onToAmountChanged(e, index++)}
                    asset={
                        to_asset_types.length > 0 && item.to_asset
                            ? item.to_asset.get("id")
                            : item.to_asset_id
                                ? item.to_asset_id
                                : to_asset_types[0]
                    }
                    assets={to_asset_types}
                    display_balance={balance(
                        to_feeAmount,
                        to_feeAsset,
                        to_account,
                        to_balanceError,
                        to_asset_types
                    )}
                    allowNaN={true}
                />
            );
        });

        let account_from = (
            <Card style={{borderRadius: "10px"}}>
                <AccountSelector
                    label="showcases.barter.account"
                    placeholder="placeholder"
                    allowPubKey={true}
                    allowUppercase={true}
                    account={from_account}
                    accountName={from_name}
                    onChange={this.fromChanged.bind(this)}
                    onAccountChanged={this.onFromAccountChanged.bind(this)}
                    hideImage
                />
                <AmountSelector
                    label="showcases.barter.title"
                    key={amount_index}
                    amount={this.state.from_barter[0].from_amount}
                    onChange={e => this.onFromAmountChanged(e, 0)}
                    asset={
                        from_asset_types.length > 0 && from_barter[0].from_asset
                            ? from_barter[0].from_asset.get("id")
                            : from_barter[0].from_asset_id
                                ? from_barter[0].rom_asset_id
                                : from_asset_types[0]
                    }
                    assets={from_asset_types}
                    display_balance={balance(
                        from_feeAmount,
                        from_feeAsset,
                        from_account,
                        from_balanceError,
                        from_asset_types
                    )}
                    allowNaN={true}
                />
                <div style={{paddingTop: "10px", paddingBottom: "10px"}}>
                    <Button onClick={this.addFromAmount.bind(this)}>
                        + Add asset
                    </Button>
                </div>
                {fromAmountSelector}
            </Card>
        );

        let account_to = (
            <Card style={{borderRadius: "10px"}}>
                <AccountSelector
                    label="showcases.barter.account"
                    placeholder="placeholder"
                    allowPubKey={true}
                    allowUppercase={true}
                    account={to_account}
                    accountName={to_name}
                    onChange={this.toChanged.bind(this)}
                    onAccountChanged={this.onToAccountChanged.bind(this)}
                    hideImage
                    typeahead={true}
                />
                <AmountSelector
                    label="showcases.barter.title"
                    amount={this.state.to_barter[0].to_amount}
                    onChange={e => this.onToAmountChanged(e, 0)}
                    asset={
                        to_asset_types.length > 0 && to_barter[0].to_asset
                            ? to_barter[0].to_asset.get("id")
                            : to_barter[0].to_asset_id
                                ? to_barter[0].to_asset_id
                                : to_asset_types[0]
                    }
                    assets={to_asset_types}
                    display_balance={balance(
                        to_feeAmount,
                        to_feeAsset,
                        to_account,
                        to_balanceError,
                        to_asset_types
                    )}
                    allowNaN={true}
                />
                <div style={{paddingTop: "10px", paddingBottom: "10px"}}>
                    <Button onClick={this.addToAmount.bind(this)}>
                        + Add asset
                    </Button>
                </div>
                {toAmountSelector}
            </Card>
        );

        let offers = (
            <Card style={{borderRadius: "10px"}}>
                {from_name} offers C X to {to_name} and receives D Y in return,
                implict price is:
                <Input addonAfter="X/Y" />
            </Card>
        );

        return (
            <div
                className="container no-overflow wrap shrink"
                style={{padding: "10px"}}
            >
                <Card>
                    {smallScreen ? (
                        <div>
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
                        </div>
                    ) : (
                        <div>
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
                        </div>
                    )}
                    <Button
                        key={"send"}
                        disabled={isSubmitNotValid}
                        onClick={
                            !isSubmitNotValid ? this.onSubmit.bind(this) : null
                        }
                    >
                        {counterpart.translate("propose")}
                    </Button>
                </Card>
            </div>
        );
    }
}

Barter = debounceRender(Barter, 50, {leading: false});

class BarterWrapper extends React.Component {
    render() {
        return <Barter {...this.props} />;
    }
}

export default connect(
    BarterWrapper,
    {
        listenTo() {
            return [SettingsStore, MarketsStore, AssetStore];
        },
        getProps() {
            return {
                starredMarkets: SettingsStore.getState().starredMarkets,
                onlyLiquid: SettingsStore.getState().viewSettings.get(
                    "onlyLiquid",
                    true
                ),
                defaultMarkets: SettingsStore.getState().defaultMarkets,
                viewSettings: SettingsStore.getState().viewSettings,
                preferredBases: SettingsStore.getState().preferredBases,
                marketStats: MarketsStore.getState().allMarketStats,
                userMarkets: SettingsStore.getState().userMarkets,
                searchAssets: AssetStore.getState().assets,
                onlyStars: MarketsStore.getState().onlyStars,
                assetsLoading: AssetStore.getState().assetsLoading
            };
        }
    }
);
