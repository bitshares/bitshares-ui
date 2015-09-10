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
        console.log( "account: ", account.account.toJS() );

        return (
            <div className="grid-block">
                <div className="grid-content small-6">
                    <table className="table striped">
                        <tr>
                            <td><Translate content="account.member.ref"/> </td>
                            <td>{account.lifetime_referrer_name !== account_name ?
                                <Link to="account" params={{account_name: account.lifetime_referrer_name}}> {account.lifetime_referrer_name} </Link> :
                                account.lifetime_referrer_name}
                            </td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.ref_percentage"/> </td>
                            <td>{account.lifetime_referrer_fee_percentage / 100}%</td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.network_percentage"/> </td>
                            <td>{account.network_fee_percentage / 100}%</td>
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
