import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import ChainStore from "api/ChainStore";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";

class VestingBalance extends React.Component {

    _onClaim(e) {
        e.preventDefault();
        let vb = ChainStore.getObject( this.props.vb );
        WalletActions.claimVestingBalance(this.props.account.id, vb);
    }

    render() {
        let {account} = this.props;
        if (!this.props.vb) {
            return null;
        }
        let vb = ChainStore.getObject( this.props.vb );
        if (!vb) {
            return null;
        }

        let cvbAsset, vestingPeriod, remaining, earned, secondsPerDay = 60 * 60 * 24,
            availablePercent, balance;
        if (vb) {
            balance = vb.getIn(["balance", "amount"]);
            cvbAsset = ChainStore.getAsset(vb.getIn(["balance", "asset_id"]));
            earned = vb.getIn(["policy", 1, "coin_seconds_earned"]);
            vestingPeriod = vb.getIn(["policy", 1, "vesting_seconds"]);

            availablePercent = earned / (vestingPeriod * balance);
        }

        let account_name = account.name;

        if (!cvbAsset) {
            return null;
        }

        if (!balance) {
            return (
                <div style={{paddingBottom: "1rem"}}>
                    <div className="exchange-bordered">
                        <div className="block-content-header" style={{marginBottom: 15}}>
                            <Translate content="account.vesting.balance_number" id={vb.get("id")} />
                        </div>
                        <table className="table key-value-table">
                            <tbody>
                                <tr>
                                    <td><Translate content="account.member.cashback"/> </td>
                                    <td><FormattedAsset amount={vb.getIn(["balance", "amount"])} asset={vb.getIn(["balance", "asset_id"])} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        }

        return (
            <div style={{paddingBottom: "1rem"}}>
                <div className="exchange-bordered">
                    <div className="block-content-header" style={{marginBottom: 15}}>
                        <Translate content="account.vesting.balance_number" id={vb.get("id")} />
                    </div>
                    <div className="grid-content">
                        <table className="table key-value-table">
                            <tbody>
                                <tr>
                                    <td><Translate content="account.member.cashback"/> </td>
                                    <td><FormattedAsset amount={vb.getIn(["balance", "amount"])} asset={vb.getIn(["balance", "asset_id"])} /></td>
                                </tr>
                                <tr>
                                    <td><Translate content="account.member.earned" /></td>
                                    <td>{utils.format_number(utils.get_asset_amount(earned / secondsPerDay, cvbAsset), 0)} <Translate content="account.member.coindays" /></td>
                                </tr>
                                <tr>
                                    <td><Translate content="account.member.required" /></td>
                                    <td>{utils.format_number(utils.get_asset_amount(vb.getIn(["balance", "amount"]) * vestingPeriod / secondsPerDay, cvbAsset), 0)} <Translate content="account.member.coindays" /></td>
                                </tr>
                                <tr>
                                    <td><Translate content="account.member.remaining" /></td>
                                    <td>{utils.format_number(vestingPeriod * (1 -  availablePercent) / secondsPerDay, 2)} days</td>
                                </tr>
                                <tr>
                                    <td><Translate content="account.member.available" /></td>
                                    <td>{utils.format_number(availablePercent * 100, 2)}% / <FormattedAsset amount={availablePercent * vb.getIn(["balance", "amount"])} asset={cvbAsset.get("id")} /></td>
                                </tr>
                                <tr>
                                    <td colSpan="2" style={{textAlign: "right"}}>
                                        <button onClick={this._onClaim.bind(this)} className="button outline"><Translate content="account.member.claim" /></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        )
    }
}

class AccountVesting extends React.Component {

    _onClaim(balance, e) {
        e.preventDefault();
        let vb = ChainStore.getObject( this.props.vb );
        WalletActions.claimVestingBalance(this.props.accountID, vb);
    }

    render() {

        if (!this.props.account || !this.props.account.get("vesting_balances")) {
            return null;
        }

        let account = this.props.account.toJS();

        let balances = account.vesting_balances.map(balance => {
            return <VestingBalance key={balance} vb={balance} account={account}/>;
        });

        return (
            <div className="grid-content" style={{overflowX: "hidden"}}>

                <div className="grid-container">

                    {!balances.length ? (
                    <h4 style={{paddingTop: "1rem"}}>
                        <Translate content={"account.vesting.no_balances"}/>
                    </h4>) : null}

                    {balances}

                </div>
            </div>
);
    }
}

AccountVesting.VestingBalance = VestingBalance;
export default AccountVesting;
