import React from "react";
import {PropTypes} from "react";
import {FormattedNumber} from "react-intl";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import Operation from "../Blockchain/Operation";
import WitnessStore from "stores/WitnessStore";

class AccountOverview extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.account_name !== this.props.account_name ||
            nextProps.cachedAccounts !== this.props.cachedAccounts ||
            nextProps.assets !== this.props.assets ||
            nextProps.accountBalances !== this.props.accountBalances
        );
    }

    render() {
        let {account_name, cachedAccounts, account_name_to_id, assets, accountBalances, accountHistories, account_id_to_name} = this.props;
        let account_id = account_name_to_id[account_name]
        let account = account_id ? cachedAccounts.get(account_id) : null;
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
        let witness_store_state = WitnessStore.getState().witnesses;
        let history = accountHistories.get(account.id).map((trx, index) => {
            if (index < 10) {
                return (
                    <Operation
                        key={index}
                        op={trx.op}
                        block={trx.block_num}
                        account_id_to_name={account_id_to_name}
                        assets={assets}
                        current={account_name}
                        witnesses={witness_store_state.witnesses}
                        witness_id_to_name={witness_store_state.witness_id_to_name}
                        inverted={this.props.settings.get("inverseMarket")}
                        />
                );
            }
        });
        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Assets</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th><Translate component="span" content="account.asset" /></th>
                                <th><Translate component="span" content="account.market_value" /></th>
                                <th><Translate component="span" content="account.hour_24" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {balances}
                        </tbody>
                    </table>
                </div>
                <div className="content-block">
                    <h3>Proposed Transactions</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Operation</th>
                                <th>Description</th>
                                <th>Expiration</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Withdraw</td>
                                <td>Withdraw 10.0 CORE from account Alice</td>
                                <td>01/01/2016</td>
                            </tr>
                            <tr>
                                <td>Deposit</td>
                                <td>Deposit 10.0 CORE to account Bob</td>
                                <td>01/01/2016</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="actions clearfix">
                        <div className="float-right">
                            <a href="#" className="button outline">Reject</a>
                            <a href="#" className="button outline">Approve</a>
                        </div>
                    </div>
                </div>
                <div className="content-block">
                <h3>Recent Transactions <Link to="account-history" params={{name: account_name}}><small> (see more) </small></Link></h3>
                    <table className="table">
                        <tbody>
                        {history}
                        </tbody>
                    </table>
                </div>
            </div>

        );
    }
}

export default AccountOverview;
