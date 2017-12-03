import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import AmountSelector from "../Utility/AmountSelector";
import BalanceComponent from "../Utility/BalanceComponent";
import AccountStakeCreateNew from './AccountStakeCreateNew';
import {ChainStore} from "bitsharesjs/es";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";
import {Apis} from "bitsharesjs-ws";
import { debounce } from "lodash";
import { checkFeeStatusAsync } from "common/trxHelper";
import counterpart from "counterpart";

const BCO_ID = '1.3.1564';

class VestingBalance extends React.Component {

    _onClaim(claimAll, e) {
        e.preventDefault();
        WalletActions.claimStakingBalance(this.props.account.id, this.props.vb, true);
    }

    render() {
        let {account, vb} = this.props;
        if (!this.props.vb) {
            return null;
        }
        // let vb = ChainStore.getObject( this.props.vb );
        // if (!vb) {
        //     return null;
        // }
        let available=false;
        let difference=0;
        let cvbAsset, vestingPeriod, remaining, earned, secondsPerDay = 60 * 60 * 24,
            availablePercent, balance;
        if (vb) {
            balance = vb.balance.amount;
            cvbAsset = ChainStore.getAsset(vb.balance.asset_id);
            earned = vb.policy[1].coin_seconds_earned;
            vestingPeriod = vb.policy[1].vesting_seconds;

            let d = new Date(vb.policy[1].start_claim);
            let d1 = new Date(vb.policy[1].start_claim);



            d1.setSeconds(d1.getSeconds() + vb.policy[1].vesting_seconds);
            available = false;
            if (new Date() >= d1 ) {
                available = true;
                difference = 0;
            } else {
                difference = parseInt((d1.getTime()/1000) - new Date().getTime()/1000);
                difference = (difference / 86400).toFixed(2);
            }





            availablePercent = earned / (vestingPeriod * balance);
        }

        let account_name = account.name;

        if (!cvbAsset) {
            return null;
        }

        if (!balance) {
            return null;
        }

        return (
            <div style={{paddingBottom: "1rem"}}>
                <div className="">
                    <div className="grid-content no-padding">
                        <h5><Translate content="account.cryptobridge.id" /> {vb.id}</h5>
                        <table className="table key-value-table">
                            <tbody>
                                <tr>
                                    <td><Translate content="account.cryptobridge.staking_amount"/> </td>
                                    <td><FormattedAsset amount={vb.balance.amount} asset={vb.balance.asset_id} /></td>
                                </tr>
                                <tr>
                                    <td><Translate content="account.cryptobridge.remaining" /></td>
                                    <td>{ difference > 0 ? <Translate days={ difference } content="account.cryptobridge.days"/> : <Translate className='green' content="account.cryptobridge.available"/> }</td>
                                </tr>
                                <tr>
                                    <td><Translate content="account.cryptobridge.status" /></td>
                                    <td colSpan="2" style={{textAlign: "right"}}>
                                        { available ?  <button onClick={this._onClaim.bind(this, false)} className="button outline"><Translate content="account.member.claim" /></button> : <Translate content="account.cryptobridge.staking" />}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        );
    }
}

class AccountVesting extends React.Component {
    constructor() {
        super();

        this.state = {
            vbs: null
        };
        this.updateFee = debounce(this.updateFee.bind(this), 250);
    }

    componentDidMount() {
        this.updateFee();
    }

    updateFee(fee_asset_id = BCO_ID) {
        checkFeeStatusAsync(
            {
                accountID: this.props.account.get("id"),
                feeID: fee_asset_id,
                type: 'vesting_balance_create'
            }
        )
        .then(({fee, hasBalance, hasPoolBalance}) => {
            this.setState({
                feeAmount: fee.getAmount({real: true}),
                hasBalance,
                hasPoolBalance,
                error: (!hasBalance || !hasPoolBalance)
            });
        });
    }

    componentWillMount() {
        this.retrieveVestingBalances.call(this, this.props.account.get("id"));
    }

    componentWillUpdate(nextProps){
        let newId = nextProps.account.get("id");
        let oldId = this.props.account.get("id");

        if(newId !== oldId){
            this.retrieveVestingBalances.call(this, newId);
        }
    }

    retrieveVestingBalances(accountId){
        Apis.instance().db_api().exec("get_vesting_balances", [
            accountId
        ]).then(vbs => {
            this.setState({vbs});
        }).catch(err => {
            console.log("error:", err);
        });
    }

    render() {
        let {vbs} = this.state;
        if (!vbs || !this.props.account || !this.props.account.get("vesting_balances")) {
            return null;
        }

        let account = this.props.account.toJS();
        let balances = vbs.map(vb => {
            //console.log('Balance amount ' + vb.balance.amount);
            if (vb.balance.amount && vb.policy && vb.policy[1].coin_seconds_earned && vb.balance.asset_id === '1.3.1564') {
                return <VestingBalance key={vb.id} vb={vb} account={account}/>;
            }
        }).filter(a => {
            return !!a;
        });

        return (
            <div className="grid-content" style={{overflowX: "hidden"}}>

                <div className="grid-content">
                    <AccountStakeCreateNew feeAmount={this.state.feeAmount} accountId={this.props.account.get("id")} balances={this.props.account.get('balances')}/>

                    {!balances.length ? (
                    <h4 style={{paddingTop: "1rem"}}>
                        <Translate content={"account.cryptobridge.no_balances"}/>
                    </h4>) : balances}
                </div>
            </div>
        );
    }
}

AccountVesting.VestingBalance = VestingBalance;
export default AccountVesting;
