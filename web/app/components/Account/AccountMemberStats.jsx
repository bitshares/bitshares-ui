import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import LoadingIndicator from "../LoadingIndicator";

class AccountMemberStats extends React.Component {

    render() {
        let {account_name, cachedAccounts, assets} = this.props;
        let account = cachedAccounts.get(account_name);

        let accountExists = true;
        if (!account) {
            return <LoadingIndicator type="circle"/>;
        } else if (account.notFound) {
            accountExists = false;
        } 
        if (!accountExists) {
            return <div className="grid-block"><h5><Translate component="h5" content="account.errors.not_found" name={account_name} /></h5></div>;
        }

        let coreAsset = assets.get("1.3.0");

        return (
            <div className="grid-block">
                <div className="grid-content small-6">
                    <table className="table striped">
                        <tr>
                            <td><Translate content="account.member.ref"/>:</td>
                            <td>{account.lifetime_referrer_name !== account_name ?
                                <Link to="account" params={{account_name: account.lifetime_referrer_name}}> {account.lifetime_referrer_name} </Link> :
                                account.lifetime_referrer_name}
                            </td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.ref_percentage"/>:</td>
                            <td>{account.lifetime_referrer_fee_percentage / 100}%</td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.network_percentage"/>:</td>
                            <td>{account.network_fee_percentage / 100}%</td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.fees_paid"/>:</td>
                            <td><FormattedAsset amount={account.stat_object.lifetime_fees_paid} asset={coreAsset.id} /></td>
                        </tr>    
                        <tr>
                            <td><Translate content="account.member.fees_pending"/>:</td>
                            <td><FormattedAsset amount={parseInt(account.stat_object.pending_fees, 10)} asset={coreAsset.id} /></td>
                        </tr>    
                        <tr>
                            <td><Translate content="account.member.fees_vested"/>:</td>
                            <td><FormattedAsset amount={account.stat_object.pending_vested_fees} asset={coreAsset.id} /></td>
                        </tr>   
                        <tr>
                            <td><Translate content="account.member.in_orders" core_asset={coreAsset.symbol}/></td>
                            <td><FormattedAsset amount={account.stat_object.total_core_in_orders} asset={coreAsset.id} /></td>
                        </tr>                           
                    </table>
                </div>
            </div>
        );
    }
}

AccountMemberStats.defaultProps = {
    account_name: "",
    cachedAccounts: {},
    assets: {}
};

AccountMemberStats.propTypes = {
    account_name: PropTypes.string.isRequired,
    cachedAccounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired
};


export default AccountMemberStats;
