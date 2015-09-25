import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import LoadingIndicator from "../LoadingIndicator";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Statistics from "./Statistics";
import AccountActions from "actions/AccountActions";
import Icon from "../Icon/Icon";
import TimeAgo from "../Utility/TimeAgo";

@BindToChainState({keep_updating:true})
class AccountMemberStats extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        gprops: ChainTypes.ChainObject.isRequired,
        dprops: ChainTypes.ChainObject.isRequired
    }
    static defaultProps = {
        gprops: "2.0.0",
        dprops: "2.1.0"
    }

    upgradeAccount(id, lifetime, e) {
        e.preventDefault();
        AccountActions.upgradeAccount(id, lifetime);
    }


    render() {
        console.log( this.props );
        let gprops = this.props.gprops;
        let dprops = this.props.dprops;

        let account = this.props.account.toJS();

        let ltr = ChainStore.getAccount( account.lifetime_referrer );
        if( ltr ) account.lifetime_referrer_name = ltr.get('name');
        let ref = ChainStore.getAccount( account.referrer );
        if( ref ) account.referrer_name = ref.get('name');
        let reg = ChainStore.getAccount( account.registrar );
        if( reg ) account.registrar_name = reg.get('name');

        let account_name = account.name;

        console.log( "account: ", account );

        let network_fee  = account.network_fee_percentage/100;
        let lifetime_fee = account.lifetime_referrer_fee_percentage/100;
        let referrer_total_fee = 100 - network_fee - lifetime_fee;
        let referrer_fee  = referrer_total_fee * account.referrer_rewards_percentage/100;
        let registrar_fee = 100 - referrer_fee - lifetime_fee - network_fee;

        gprops = gprops.toJS();
        dprops = dprops.toJS();
        console.log( "gprops: ", gprops );
        console.log( "dprops: ", dprops );

        let member_status = ChainStore.getAccountMemberStatus(this.props.account);
        let membership = "account.member." + member_status;
        let expiration = null
        if( member_status === "annual" )
           expiration = (<span>(<Translate content="account.member.expires"/> <TimeAgo time={account.membership_expiration_date} />)</span>)
        let expiration_date = account.membership_expiration_date;
        if( expiration_date === "1969-12-31T23:59:59" )
           expiration_date = "Never"
        else if( expiration_date === "1970-01-01T00:00:00" )
           expiration_date = "N/A"

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3><Translate content={membership}/> {expiration}</h3>
                    { member_status=== "lifetime" ? null : (
                       <div>
                       <h3> Get {100-network_fee}% Cashback on Fees </h3>
                       <p>
                          Lifetime Members get {100-network_fee}% cashback on every transaction fee they pay and
                          qualify to earn referral income from users they register with or referr to the network. A
                          Lifetime membership is just <FormattedAsset amount={gprops.parameters.current_fees.parameters[8][1].membership_lifetime_fee*gprops.parameters.current_fees.scale/10000} asset="1.3.0"/>.
                       </p>
                       { member_status === "annual" ? null : (
                          <p>
                             If a lifetime membership is too much you can still get {100-network_fee-lifetime_fee}% cashback for the next year by becoming an
                             annual subscriber for just <FormattedAsset amount={gprops.parameters.current_fees.parameters[8][1].membership_annual_fee*gprops.parameters.current_fees.scale/10000} asset="1.3.0"/> per
                             year.
                          </p>
                       )}

                       <table>
                           <tr>
                               <td>
                                   <a href className="button" onClick={this.upgradeAccount.bind(this, account.id, true)}>
                                       <Translate content="account.member.upgrade_lifetime"/>
                                   </a>
                               </td>
                               <td width="15%"></td>
                               <td>
                                   {member_status === "annual" ? null :
                                   <a href className="button" onClick={this.upgradeAccount.bind(this, account.id, false)}>
                                       <Translate content="account.member.subscribe"/>
                                   </a>}
                               </td>
                           </tr>
                       </table>
                       <br/>
                       <hr/>
                       <br/>
                       </div>
                    )}


                    <h4><Translate content="account.member.fee_allocation"/></h4>
                    <div className="small-6">
                        <table className="table striped">
                            <tr>
                                <td><Translate content="account.member.network_percentage"/></td>
                                <td>{network_fee}%</td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.lifetime_referrer"/>  &nbsp;
                                (<Link to="account" params={{account_name: account.lifetime_referrer}}>{account.lifetime_referrer_name}</Link>)
                                </td>
                                <td>{lifetime_fee}%</td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.registrar"/>  &nbsp;
                                (<Link to="account" params={{account_name: account.registrar_name}}>{account.registrar_name}</Link>)
                                </td>
                                <td>{registrar_fee}%</td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.referrer"/>  &nbsp;
                                (<Link to="account" params={{account_name: account.referrer}}>{account.referrer_name }</Link>)
                                </td>
                                <td>{referrer_fee}%</td>
                            </tr>
                        </table>
                        <br/>
                        <Statistics stat_object={account.statistics}/>
                        <table className="table striped">
                            <tr>
                                <td><Translate content="account.member.membership_expiration"/> </td>
                                <td>{expiration_date}</td>
                            </tr>
                        </table>
                    </div>


                </div>
                <div className="grid-content small-6">
                   <h3>Fee Division</h3>
                   <p>
                   Every time <Link to="account" params={{account_name:account_name}}> {account_name} </Link> pays a transaction fee, that fee is divided among several different accounts.  The network takes
                   a {network_fee}% cut, and the Lifetime Member who referred <Link to="account" params={{account_name:account_name}}> {account_name} </Link> gets a {lifetime_fee}% cut.  
                   </p>
                   <p>
                   The <i>registrar</i> is the account that paid the transaction fee to register {account_name} with the network.  The registrar gets to decide how to 
                   divide the remaining {referrer_total_fee}% between themselves and their own <i>Affiliate Referrer</i> program.  
                   </p>
                   <p><Link to="account" params={{account_name:account_name}}>{account_name}</Link>'s registrar chose to share  &nbsp;
                   {referrer_fee}% of the total fee with the <i>Affiliate Referrer</i> and keep  &nbsp;
                   {registrar_fee}% of the total fee for themeselves.
                   </p>
                   <h3>Pending Fees</h3>
                   <p>
                   Fees paid by {account_name} are only divided among the network, referrers, and registrars once every maintenance interval ({gprops.parameters.maintenance_interval} seconds). The
                   next maintenance time is <TimeAgo time={dprops.next_maintenance_time} />.
                   </p>
                   <h3>Vesting Fees</h3>
                   <p>
                   Most fees are made available immediately, but fees over <FormattedAsset amount={gprops.parameters.cashback_vesting_threshold} asset="1.3.0" /> (such as those paid to upgrade your membership or register a premium account name) must vest for a total of {gprops.parameters.cashback_vesting_period_seconds/60/60/24} days.
                   </p>
                </div>
            </div>
        );
    }
}

export default AccountMemberStats;
