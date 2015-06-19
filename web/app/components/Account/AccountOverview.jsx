import React from "react";
import {PropTypes} from "react";
import {FormattedNumber} from "react-intl";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";

class AccountOverview extends React.Component {

    render() {
        let {account_name, browseAccounts, account_name_to_id, assets, accountBalances} = this.props;
        let account = account_name_to_id[account_name] ? browseAccounts.get(account_name_to_id[account_name]) : null;
        if(!account) return <div>Account {account_name} couldn't be displayed</div>;
        let balances = accountBalances.get(account.id).map( balance => {
            balance.amount = parseFloat(balance.amount);
            return (
                <tr key={balance.asset_id}>
                    <td><FormattedAsset amount={balance.amount} asset={assets.get(balance.asset_id)}/></td>
                    <td><FormattedAsset amount={balance.amount} asset={assets.get(balance.asset_id)}/></td>
                    <td><FormattedNumber style="percent" value={0.1 * Math.random()}/></td>
                </tr>
            );
        });
        return (
            <div className="grid-content no-overflow">
                <table style={{width: "100%"}} className="table text-center">
                    <thead>
                    <tr>
                        <th><Translate component="span" content="account.assets" /></th>
                        <th><Translate component="span" content="account.value" /></th>
                        <th><Translate component="span" content="account.hour_24" /></th>
                    </tr>
                    </thead>
                    <tbody>
                    {balances}
                    </tbody>
                </table>
            </div>
        );
    }
}

export default AccountOverview;
