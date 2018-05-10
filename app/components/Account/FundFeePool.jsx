import React from "react";
import classnames from "classnames";
import Translate from "react-translate-component";

import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedFee from "../Utility/FormattedFee";
import AssetActions from "actions/AssetActions";
import AssetWrapper from "../Utility/AssetWrapper";
import {ChainStore} from "bitsharesjs/es";

const stateSetter = (that, key, transform = value => value) => value =>
    that.setState({[key]: transform(value)});

const keyGetter = key => object => object[key];

class FundFeePool extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.initialState();
    }
    onAccountNameChanged = stateSetter(this, "funderAccountName");
    onAccountChanged = stateSetter(this, "newFunderAccount");
    onPoolInput = stateSetter(this, "fundPoolAmount", keyGetter("amount"));
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
        fundPoolAmount: 0
    });
    render = () => {
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
        const account = newFunderAccount;
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
                <Translate component="span" content="transfer.available" />:&nbsp;
                <FormattedAsset amount={balance} asset={coreID} />
            </span>
        );
        return (
            <div>
                <Translate
                    component="p"
                    content="explorer.asset.fee_pool.fund_text"
                    asset={asset.get("symbol")}
                    core={core.get("symbol")}
                />

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

                <div style={{paddingTop: "1rem"}}>
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
                    <br />
                    <br />
                    <p>
                        <Translate content="account.user_issued_assets.approx_fee" />:{" "}
                        <FormattedFee opType="asset_fund_fee_pool" />
                    </p>
                    <hr />
                </div>
            </div>
        );
    };
}

FundFeePool = AssetWrapper(FundFeePool, {
    propNames: ["asset", "core"],
    defaultProps: {
        core: "1.3.0"
    },
    withDynamic: true
});

export default FundFeePool;
