import React, {Component} from "react";
import PropTypes from "prop-types";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import {Input, Card, Col, Row, Button} from "bitshares-ui-style-guide";
import AccountSelector from "../Account/AccountSelector";
import AssetSelector from "../Utility/AssetSelector";
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

class Barter extends Component {
    constructor() {
        super();
        this.state = {
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,
            to_amount: "",
            from_amount: "",
            from_asset_id: null,
            from_asset: null,
            to_asset_id: null,
            to_asset: null,
            from_feeAmount: new Asset({amount: 0}),
            from_feeStatus: {},
            from_feeAsset: null,
            to_feeAmount: new Asset({amount: 0}),
            to_feeStatus: {},
            to_feeAsset: null,
            amount_counter: []
        };
        this._checkBalance = this._checkBalance.bind(this);
        this._checkFeeStatus = this._checkFeeStatus.bind(this);
    }
    componentWillMount() {
        let currentAccount = AccountStore.getState().currentAccount;
        if (!this.state.from_name) this.setState({from_name: currentAccount});
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
                    from_feeStatus: {},
                    from_fee_asset_id: "1.3.0",
                    from_feeAmount: new Asset({amount: 0}),
                    to_feeStatus: {},
                    to_fee_asset_id: "1.3.0",
                    to_feeAmount: new Asset({amount: 0})
                },
                () => {
                    this._updateFee();
                    this._checkFeeStatus();
                }
            );
        }
    }
    getAccount() {
        this.setState({
            from_name: this.state.from_name,
            from_account: ChainStore.getAccount(this.state.from_name)
        });
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

    onFoundBaseAsset(asset) {
        if (asset) {
            this.setState({active_from_asset: asset.get("symbol")});
        }
    }
    assetFromChanged(asset) {
        if (asset) {
            this.setState({from_asset: asset});
        }
    }

    assetToChanged(asset) {
        if (asset) {
            this.setState({to_asset: asset});
        }
    }

    onFromAmountChanged({amount, asset}) {
        if (!asset) {
            return;
        }
        this.setState(
            {
                from_amount: amount,
                from_asset: asset,
                from_asset_id: asset.get("id"),
                error: null,
                maxAmount: false
            },
            this._checkBalance
        );
    }
    onToAmountChanged({amount, asset}) {
        if (!asset) {
            return;
        }
        this.setState(
            {
                to_amount: amount,
                to_asset: asset,
                to_asset_id: asset.get("id"),
                error: null,
                maxAmount: false
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
    _updateFee(state = this.state) {
        if (!state.open) return;
        let {
            from_fee_asset_id,
            from_account,
            from_asset_id,
            to_fee_asset_id,
            to_account,
            to_asset_id
        } = state;
        const {
            from_fee_asset_types,
            to_fee_asset_types
        } = this._getAvailableAssets(state);
        if (
            from_fee_asset_types.length === 1 &&
            from_fee_asset_types[0] !== from_fee_asset_id &&
            to_fee_asset_types.length === 1 &&
            to_fee_asset_types[0] !== to_fee_asset_id
        ) {
            from_fee_asset_id = from_fee_asset_types[0];
            to_fee_asset_id = to_fee_asset_types[0];
        }
        if (!from_account || !to_account) return null;

        checkFeeStatusAsync({
            accountID: from_account.get("id"),
            feeID: from_fee_asset_id,
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content: state.memo
            }
        }).then(({fee, hasBalance, hasPoolBalance}) =>
            shouldPayFeeWithAssetAsync(from_account, fee).then(
                should =>
                    should
                        ? this.setState(
                              {from_fee_asset_id: from_asset_id},
                              this._updateFee
                          )
                        : this.setState({
                              from_feeAmount: fee,
                              from_fee_asset_id: fee.asset_id,
                              from_hasBalance: hasBalance,
                              from_hasPoolBalance: hasPoolBalance,
                              from_error: !hasBalance || !hasPoolBalance
                          })
            )
        );

        checkFeeStatusAsync({
            accountID: to_account.get("id"),
            feeID: to_fee_asset_id,
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content: state.memo
            }
        }).then(({fee, hasBalance, hasPoolBalance}) =>
            shouldPayFeeWithAssetAsync(from_account, fee).then(
                should =>
                    should
                        ? this.setState(
                              {to_fee_asset_id: to_asset_id},
                              this._updateFee
                          )
                        : this.setState({
                              to_feeAmount: fee,
                              to_fee_asset_id: fee.asset_id,
                              to_hasBalance: hasBalance,
                              to_hasPoolBalance: hasPoolBalance,
                              to_error: !hasBalance || !hasPoolBalance
                          })
            )
        );
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
    _checkFeeStatus(state = this.state) {
        let {from_account, to_account, open} = state;
        if (!from_account || !to_account || !open) return;

        const from_assets = Object.keys(
            from_account.get("balances").toJS()
        ).sort(utils.sortID);
        const to_assets = Object.keys(to_account.get("balances").toJS()).sort(
            utils.sortID
        );
        let from_feeStatus = {};
        let to_feeStatus = {};
        let p = [];
        let t = [];
        from_assets.forEach(a => {
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
                from_assets.forEach((a, idx) => {
                    from_feeStatus[a] = status[idx];
                });
                if (
                    !utils.are_equal_shallow(
                        this.state.from_feeStatus,
                        from_feeStatus
                    )
                ) {
                    this.setState({
                        from_feeStatus
                    });
                }
                this._checkBalance();
            })
            .catch(err => {
                console.error(err);
            });

        to_assets.forEach(a => {
            t.push(
                checkFeeStatusAsync({
                    accountID: to_account.get("id"),
                    feeID: a,
                    options: ["price_per_kbyte"],
                    data: {
                        type: "memo",
                        content: this.state.memo
                    }
                })
            );
        });
        Promise.all(t)
            .then(status => {
                to_assets.forEach((a, idx) => {
                    to_feeStatus[a] = status[idx];
                });
                if (
                    !utils.are_equal_shallow(
                        this.state.to_feeStatus,
                        to_feeStatus
                    )
                ) {
                    this.setState({
                        to_feeStatus
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
                {maxAmount: true, to_amount: balance.getAmount({real: true})},
                this._checkBalance
            );
        }
    }

    addAmount() {
        this.state.amount_counter.push("");
        this.setState({amount_counter: this.state.amount_counter});
    }

    render() {
        let {
            from_name,
            to_name,
            from_account,
            to_account,
            from_amount,
            to_amount,
            asset,
            from_asset,
            to_asset,
            from_feeAsset,
            to_feeAsset,
            from_asset_id,
            to_asset_id,
            from_feeAmount,
            to_feeAmount,
            from_balanceError,
            to_balanceError,
            amount_counter
        } = this.state;
        let {
            from_asset_types,
            to_asset_types,
            from_fee_asset_types,
            to_fee_asset_types
        } = this._getAvailableAssets();
        let smallScreen = window.innerWidth < 850 ? true : false;
        //let defaultBases = this.props.preferredBases.map(a => a);
        let from_balance = null;
        let to_balance = null;
        let from_balance_fee = null;
        let to_balance_fee = null;

        let balance = (
            feeAmount,
            feeAsset,
            account,
            balanceError,
            asset_types
        ) => {
            let fee = feeAmount.getAmount({real: true});
            if (account && account.get("balances")) {
                let account_balances = account.get("balances").toJS();
                let _error = balanceError ? "has-error" : "";
                if (asset_types.length === 1)
                    asset = ChainStore.getAsset(asset_types[0]);
                if (asset_types.length > 0) {
                    let current_asset_id = asset
                        ? asset.get("id")
                        : asset_types[0];
                    let feeID = feeAsset ? feeAsset.get("id") : "1.3.0";

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

        let amount = amount_counter.map(item => {
            return (
                <AmountSelector
                    label="showcases.barter.title"
                    amount={from_amount}
                    onChange={this.onFromAmountChanged.bind(this)}
                    asset={
                        from_asset_types.length > 0 && from_asset
                            ? from_asset.get("id")
                            : from_asset_id
                                ? from_asset_id
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
                    amount={from_amount}
                    onChange={this.onFromAmountChanged.bind(this)}
                    asset={
                        from_asset_types.length > 0 && from_asset
                            ? from_asset.get("id")
                            : from_asset_id
                                ? from_asset_id
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
                    <Button onClick={this.addAmount.bind(this)}>
                        + Add asset
                    </Button>
                </div>
                {amount}
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
                />
                <AmountSelector
                    label="showcases.barter.title"
                    amount={to_amount}
                    onChange={this.onToAmountChanged.bind(this)}
                    asset={
                        to_asset_types.length > 0 && to_asset
                            ? to_asset.get("id")
                            : to_asset_id
                                ? to_asset_id
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
                    <Button onClick={this.addAmount.bind(this)}>
                        + Add asset
                    </Button>
                </div>
                {amount}
            </Card>
        );

        let offers = (
            <Card style={{borderRadius: "10px"}}>
                Some text
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
                    <Button>Propose</Button>
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
