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

class AccountMemberStats extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired,
        account_name: React.PropTypes.string.isRequired
    }

    upgradeAccount(id, lifetime, e) {
        e.preventDefault();
        AccountActions.upgradeAccount(id, lifetime);
    }

    render() {
        let account = this.props.account.toJS();
        let network_fee = account.network_fee_percentage / 100;
        let lifetime_fee = account.lifetime_referrer_fee_percentage / 100;
        let referrer_fee = account.referrer_rewards_percentage / 100;
        let registrar_fee = 100 - network_fee - lifetime_fee - referrer_fee;
        let member_status = ChainStore.getAccountMemberStatus(this.props.account);
        let membership = "account.member." + member_status;
        let upgrade = null;
        if (this.props.isMyAccount && member_status !== "lifetime") {
            upgrade = (
                <div className="content-block">
                    <h3>Upgrade Account</h3>
                    <table className="table">
                        <tr>
                            <td><h4><Translate content="account.member.annual"/></h4></td>
                            <td><h4><Translate content="account.member.lifetime"/></h4></td>
                        </tr>
                        <tr>
                            <td>TODO: annual membership benefits</td>
                            <td>TODO: lifetime membership benefits</td>
                        </tr>
                        <tr>
                            <td>2,000 CORE Fee</td>
                            <td>10,000 CORE Fee</td>
                        </tr>
                        <tr>
                            <td>
                                {member_status === "annual" ? <span><Icon name="checkmark"/> Upgraded</span> :
                                <a href className="button outline" onClick={this.upgradeAccount.bind(this, account.id, false)}>
                                    <Translate content="account.upgrade"/>
                                </a>}
                            </td>
                            <td>
                                <a href className="button outline" onClick={this.upgradeAccount.bind(this, account.id, true)}>
                                    <Translate content="account.upgrade"/>
                                </a>
                            </td>
                        </tr>
                    </table>
                </div>
            );
        }

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Member Stats</h3>
                    <div className="small-6">
                        <table className="table striped">
                            <tr>
                                <td><Translate content="account.member.membership"/></td>
                                <td><Translate content={membership}/></td>
                                <td>{registrar_fee}%</td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.registrar"/></td>
                                <td>
                                    <Link to="account" params={{account_name: account.registrar_name}}> {account.registrar_name} </Link>
                                </td>
                                <td>{registrar_fee}%</td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.lifetime_referrer"/></td>
                                <td>
                                    <Link to="account" params={{account_name: account.lifetime_referrer}}> {account.lifetime_referrer_name} </Link>
                                </td>
                                <td>{lifetime_fee}%</td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.referrer"/></td>
                                <td>
                                    <Link to="account" params={{account_name: account.referrer}}> {account.referrer_name } </Link>
                                </td>
                                <td>{referrer_fee}%</td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.network_percentage"/></td>
                                <td></td>
                                <td>{network_fee}%</td>
                            </tr>
                        </table>
                        <br/>
                        <Statistics stat_object={account.statistics}/>
                    </div>
                </div>
                {upgrade}
            </div>
        );
    }
}

export default AccountMemberStats;
