import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import LoadingIndicator from "../LoadingIndicator";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Statistics from "./Statistics";

class AccountMemberStats extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired,
        account_name: React.PropTypes.string.isRequired
    }

    render() {
        console.log("-- AccountMemberStats.render -->", this.props);
        let account_name = this.props.account_name;
        let account = this.props.account.toJS();
        console.log( "account: ", account );

        let network_fee = account.network_fee_percentage/100;
        let lifetime_fee = account.lifetime_referrer_fee_percentage/100;
        let referrer_fee = account.referrer_rewards_percentage/100;
        let registrar_fee = 100 - network_fee - lifetime_fee - referrer_fee;
        console.log( network_fee, lifetime_fee, referrer_fee, registrar_fee );

        let membership = "account.member."+ChainStore.getAccountMemberStatus( this.props.account );//"account.member.basic";

        return (
            <div className="grid-block">
                <div className="grid-content small-6">
                    <table className="table striped">
                        <tr>
                            <td><Translate content="account.member.membership"/> </td>
                            <td><Translate content={membership}/> </td>
                            <td>{registrar_fee}%</td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.registrar"/> </td>
                            <td>
                                <Link to="account" params={{account_name: account.registrar_name}}> {account.registrar_name} </Link> 
                            </td>
                            <td>{registrar_fee}%</td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.lifetime_referrer"/> </td>
                            <td>
                                <Link to="account" params={{account_name: account.lifetime_referrer}}> {account.lifetime_referrer_name} </Link> 
                            </td>
                            <td>{lifetime_fee}%</td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.referrer"/> </td>
                            <td>
                                <Link to="account" params={{account_name: account.referrer}}> {account.referrer_name } </Link> 
                            </td>
                            <td>{referrer_fee}%</td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.network_percentage"/> </td>
                            <td></td>
                            <td>{network_fee}%</td>
                        </tr>
                    </table>
                    <br/>
                    <Statistics stat_object={account.statistics}/>
                </div>
            </div>
        );
    }
}

export default AccountMemberStats;
