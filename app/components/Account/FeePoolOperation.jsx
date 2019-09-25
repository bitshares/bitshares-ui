import React from "react";
import classnames from "classnames";
import Translate from "react-translate-component";
import {Asset} from "common/MarketClasses";
import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";
import FormattedAsset from "../Utility/FormattedAsset";
import AssetActions from "actions/AssetActions";
import AssetWrapper from "../Utility/AssetWrapper";
import {ChainStore} from "tuscjs";

const stateSetter = (that, key, transform = value => value) => value =>
    that.setState({[key]: transform(value)});

const keyGetter = key => object => object[key];

class FeePoolOperation extends React.Component {
    static defaultProps = {
        type: "fund"
    };

    constructor(props) {
        super(props);
        this.state = this.initialState();
    }

    onAccountNameChanged = stateSetter(this, "funderAccountName");
    onAccountChanged = stateSetter(this, "newFunderAccount");
    onPoolInput = stateSetter(this, "fundPoolAmount", keyGetter("amount"));

    onClaimInput(key, {amount}) {
        this.state[key + "Asset"].setAmount({real: amount});
        this.setState({
            [key]: amount
        });
    }

    onFundPool = () =>
        AssetActions.fundPool(
            this.state.newFunderAccount
                ? this.state.newFunderAccount.get("id")
                : null,
            this.props.core,
            this.props.asset,
            this.state.fundPoolAmount.replace(/,/g, "")
        );

    reset = () => {
        this.setState(this.initialState());
    };

    initialState = () => ({
        funderAccountName: this.props.funderAccountName,
        fundPoolAmount: 0,
        fundPoolAsset: new Asset({
            amount: 0,
            precision: this.props.core.get("precision"),
            asset_id: this.props.core.get("id")
        }),
        claimPoolAmount: 0,
        claimPoolAmountAsset: new Asset({
            amount: 0,
            precision: this.props.core.get("precision"),
            asset_id: this.props.core.get("id")
        }),
        claimFeesAmount: 0,
        claimFeesAmountAsset: new Asset({
            amount: 0,
            precision: this.props.asset.get("precision"),
            asset_id: this.props.asset.get("id")
        })
    });

    onClaimFees() {
        let account = ChainStore.getAccount(this.props.funderAccountName);
        if (!account) return;
        AssetActions.claimPoolFees(
            account.get("id"),
            this.props.asset,
            this.state.claimFeesAmountAsset
        );
    }

    onClaimPool = () =>
        AssetActions.claimPool(
            this.props.asset,
            this.state.claimPoolAmountAsset
        );

    renderFundPool() {
        const {
            props,
            state,
            onPoolInput,
            onFundPool,
            reset,
            onAccountNameChanged,
            onAccountChanged
        } = this;
        const {asset, core, hideBalance, getDynamicObject} = props;
        const {funderAccountName, fundPoolAmount, newFunderAccount} = state;
        let dynamicObject = null;
        if (!hideBalance)
            dynamicObject = getDynamicObject(
                asset.get("dynamic_asset_data_id")
            );
        const coreID = core.get("id") || "1.3.0";
        let balance = 0;
        if (newFunderAccount) {
            const coreBalanceID = newFunderAccount.getIn(["balances", coreID]);
            if (coreBalanceID) {
                let balanceObject = ChainStore.getObject(coreBalanceID);
                if (balanceObject) {
                    balance = balanceObject.get("balance");
                }
            }
        }
        const balanceText = (
            <span>
                <Translate component="span" content="transfer.available" />
                :&nbsp;
                <FormattedAsset amount={balance} asset={coreID} />
            </span>
        );
        return (
            <div>
                {hideBalance || (
                    <div style={{paddingBottom: "1.5rem"}}>
                        <Translate content="explorer.asset.fee_pool.pool_balance" />
                        <span>: </span>
                        {dynamicObject ? (
                            <FormattedAsset
                                amount={dynamicObject.get("fee_pool")}
                                asset={coreID}
                            />
                        ) : null}
                    </div>
                )}

                <AccountSelector
                    label="transaction.funding_account"
                    accountName={funderAccountName}
                    onChange={onAccountNameChanged}
                    onAccountChanged={onAccountChanged}
                    account={funderAccountName}
                    error={null}
                    tabIndex={1}
                />

                <AmountSelector
                    label="transfer.amount"
                    display_balance={balanceText}
                    amount={fundPoolAmount}
                    onChange={onPoolInput}
                    asset={coreID}
                    assets={[coreID]}
                    placeholder="0.0"
                    tabIndex={2}
                    style={{width: "100%", paddingTop: 16}}
                />

                <div style={{paddingTop: "1rem"}} className="button-group">
                    <button
                        className={classnames("button", {
                            disabled: fundPoolAmount <= 0
                        })}
                        onClick={onFundPool}
                    >
                        <Translate content="transaction.trxTypes.asset_fund_fee_pool" />
                    </button>
                    <button className="button outline" onClick={reset}>
                        <Translate content="account.perm.reset" />
                    </button>
                </div>
            </div>
        );
    }

    renderClaimPool() {
        const {props, onClaimPool, reset} = this;
        const {claimPoolAmount} = this.state;
        const {asset, core, getDynamicObject} = props;
        let dynamicObject = getDynamicObject(
            asset.get("dynamic_asset_data_id")
        );
        const coreID = core.get("id") || "1.3.0";

        const balanceText = !!dynamicObject ? (
            <span
                onClick={() => {
                    this.state.claimPoolAmountAsset.setAmount({
                        sats: dynamicObject.get("fee_pool")
                    });
                    this.setState({
                        claimPoolAmount: this.state.claimPoolAmountAsset.getAmount(
                            {
                                real: true
                            }
                        )
                    });
                }}
            >
                <Translate component="span" content="transfer.available" />
                :&nbsp;
                <FormattedAsset
                    amount={dynamicObject.get("fee_pool")}
                    asset={coreID}
                />
            </span>
        ) : null;

        return (
            <div>
                <Translate
                    component="p"
                    content="explorer.asset.fee_pool.claim_pool_text"
                />
                <AmountSelector
                    label="transfer.amount"
                    display_balance={balanceText}
                    amount={claimPoolAmount}
                    onChange={this.onClaimInput.bind(this, "claimPoolAmount")}
                    asset={coreID}
                    assets={[coreID]}
                    placeholder="0.0"
                    tabIndex={2}
                    style={{width: "100%", paddingTop: 16}}
                />

                <div style={{paddingTop: "1rem"}} className="button-group">
                    <button
                        className={classnames("button", {
                            disabled: claimPoolAmount <= 0
                        })}
                        onClick={onClaimPool}
                    >
                        <Translate content="transaction.trxTypes.asset_claim_fee_pool" />
                    </button>
                    <button className="button outline" onClick={reset}>
                        <Translate content="account.perm.reset" />
                    </button>
                </div>
            </div>
        );
    }

    renderClaimFees() {
        const {props} = this;
        const {claimFeesAmount} = this.state;
        const {asset, getDynamicObject} = props;
        let dynamicObject = getDynamicObject(
            asset.get("dynamic_asset_data_id")
        );

        let unclaimedBalance = dynamicObject
            ? dynamicObject.get("accumulated_fees")
            : 0;
        let validClaim =
            claimFeesAmount > 0 &&
            this.state.claimFeesAmountAsset.getAmount() <= unclaimedBalance;

        let unclaimedBalanceText = (
            <span>
                <Translate component="span" content="transfer.available" />
                :&nbsp;
                <FormattedAsset
                    amount={unclaimedBalance}
                    asset={asset.get("id")}
                />
            </span>
        );

        return (
            <div>
                <Translate
                    component="p"
                    content="explorer.asset.fee_pool.claim_text"
                    asset={asset.get("symbol")}
                />
                <div style={{paddingBottom: "1rem"}}>
                    <Translate content="explorer.asset.fee_pool.unclaimed_issuer_income" />
                    :&nbsp;
                    {dynamicObject ? (
                        <FormattedAsset
                            amount={dynamicObject.get("accumulated_fees")}
                            asset={asset.get("id")}
                        />
                    ) : null}
                </div>

                <AmountSelector
                    label="transfer.amount"
                    display_balance={unclaimedBalanceText}
                    amount={claimFeesAmount}
                    onChange={this.onClaimInput.bind(this, "claimFeesAmount")}
                    asset={asset.get("id")}
                    assets={[asset.get("id")]}
                    placeholder="0.0"
                    tabIndex={1}
                    style={{width: "100%", paddingTop: 16}}
                />

                <div style={{paddingTop: "1rem"}} className="button-group">
                    <button
                        className={classnames("button", {
                            disabled: !validClaim
                        })}
                        onClick={this.onClaimFees.bind(this)}
                    >
                        <Translate content="explorer.asset.fee_pool.claim_fees" />
                    </button>
                    <button
                        className="button outline"
                        onClick={this.reset.bind(this)}
                    >
                        <Translate content="account.perm.reset" />
                    </button>
                </div>
            </div>
        );
    }

    render() {
        if (this.props.type === "fund") {
            return this.renderFundPool();
        } else if (this.props.type === "claim") {
            return this.renderClaimPool();
        } else if (this.props.type === "claim_fees") {
            return this.renderClaimFees();
        }
    }
}

FeePoolOperation = AssetWrapper(FeePoolOperation, {
    propNames: ["asset", "core"],
    defaultProps: {
        core: "1.3.0"
    },
    withDynamic: true
});

export default FeePoolOperation;
