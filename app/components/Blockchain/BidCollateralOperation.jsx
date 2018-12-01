import React from "react";
import classnames from "classnames";
import Translate from "react-translate-component";
import {Asset} from "common/MarketClasses";
import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";
import FormattedAsset from "../Utility/FormattedAsset";
import AssetActions from "actions/AssetActions";
import AssetWrapper from "../Utility/AssetWrapper";
import {ChainStore} from "bitsharesjs";

class BidCollateralOperation extends React.Component {
    constructor(props) {
        super(props);

        this.state = this.initialState();
    }

    initialState = () => ({
        account: ChainStore.getAccount(this.props.funderAccountName),
        collateralAmount: "0",
        debtAmount: "0",
    });

    reset() {
        this.setState(this.initialState());
    };

    _collateralBidInput(value) {
        this.setState({
            collateralAmount: value.amount
        });
    }

    _debtBidInput(value) {
        this.setState({
            debtAmount: value.amount
        });
    }

    _onBidCollateral() {
        let {collateralAmount, debtAmount} = this.state;

        collateralAmount = collateralAmount == 0 ? collateralAmount : collateralAmount.replace(/,/g, "");
        debtAmount = debtAmount == 0 ? debtAmount : debtAmount.replace(/,/g, "");

        AssetActions.bidCollateral(
            this.state.account
                ? this.state.account.get("id")
                : null,
            this.props.core,
            this.props.asset,
            collateralAmount,
            debtAmount
        );
        setTimeout(() => {
            this.props.onUpdate();
        }, 6000);
    };

    removeBid() {
        AssetActions.bidCollateral(
            this.state.account
                ? this.state.account.get("id")
                : null,
            this.props.core,
            this.props.asset,
            0,
            0
        );
        setTimeout(() => {
            this.props.onUpdate();
        }, 6000);
    }

    renderCollateralBid() {
        const {
            asset, 
            core
        } = this.props;
        const {
            account, 
            collateralAmount, 
            debtAmount,
        } = this.state;

        let tabIndex = 1;
        const coreID = core.get("id") || "1.3.0";
        let balance = 0;
        const coreBalanceID = account.getIn(["balances", coreID]);
        if (coreBalanceID) {
            let balanceObject = ChainStore.getObject(coreBalanceID);
            if (balanceObject) {
                balance = balanceObject.get("balance");
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
                <AmountSelector
                    label="transaction.collateral"
                    display_balance={balanceText}
                    amount={collateralAmount}
                    onChange={this._collateralBidInput.bind(this)}
                    asset={coreID}
                    assets={[coreID]}
                    placeholder="0.0"
                    tabIndex={tabIndex++}
                    style={{width: "100%", paddingTop: 16}}
                />

                <AmountSelector
                    label="transaction.borrow_amount"
                    amount={debtAmount}
                    onChange={this._debtBidInput.bind(this)}
                    asset={asset.get("id")}
                    assets={[asset.get("id")]}
                    placeholder="0.0"
                    tabIndex={tabIndex++}
                    style={{width: "100%", paddingTop: 16}}
                />

                <div style={{paddingTop: "1rem"}} className="button-group">
                    <button
                        className={classnames("button")}
                        onClick={this._onBidCollateral.bind(this)}
                        tabIndex={tabIndex++}
                    >
                        <Translate content="transaction.trxTypes.asset_fund_fee_pool" />
                    </button>
                    <button className="button outline" onClick={this.reset.bind(this)} tabIndex={tabIndex++}>
                        <Translate content="account.perm.reset" />
                    </button>
                </div>
            </div>
        );
    }

    render() {
        return(
            this.renderCollateralBid()
        );
    }
}

BidCollateralOperation = AssetWrapper(BidCollateralOperation, {
    propNames: ["asset", "core"],
    defaultProps: {
        core: "1.3.0"
    },
    withDynamic: true
});

export default BidCollateralOperation;