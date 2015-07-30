import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import Operation from "../Blockchain/Operation";
import WitnessStore from "stores/WitnessStore";
import LoadingIndicator from "../LoadingIndicator";

class AccountOverview extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.account_name !== this.props.account_name ||
            nextProps.cachedAccounts !== this.props.cachedAccounts ||
            nextProps.assets !== this.props.assets ||
            nextProps.accountBalances !== this.props.accountBalances ||
            // Object.keys(nextProps.account_id_to_name).equals(Object.keys(this.props.account_id_to_name))
            // returning true here until issue #93 has been resolved
            true
        );
    }

    render() {
        let {account_name, cachedAccounts, account_name_to_id, assets, accountBalances, accountHistories, account_id_to_name} = this.props;
        let account = account_name ? cachedAccounts.get(account_name) : null;

        let accountExists = true;
        if (!account) {
            return <LoadingIndicator type="circle"/>;
        } else if (account.notFound) {
            accountExists = false;
        } 

        if (!accountExists) {
            return <div className="grid-block"><h5><Translate component="h5" content="account.errors.not_found" name={account_name} /></h5></div>;
        }

        let balances = null;
        if (accountBalances && assets) {
            balances = accountBalances.get(account.name).map( balance => {
                balance.amount = parseFloat(balance.amount);
                let asset = assets.get(balance.asset_id);
                if (asset) {
                    return (
                        <tr key={balance.asset_id}>
                            <td><FormattedAsset amount={balance.amount} asset={asset}/></td>
                            <td><FormattedAsset amount={balance.amount} asset={asset}/></td>
                        </tr>
                    );
                }
            });
        }
        let witness_store_state = WitnessStore.getState().witnesses;
        let history = accountHistories.get(account_name).map((trx, index) => {
            if (index < 10) {
                return (
                    <Operation
                        key={index}
                        op={trx.op}
                        block={trx.block_num}
                        account_id_to_name={account_id_to_name}
                        assets={assets}
                        current={account.id}
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
                    <h3><Translate content="transfer.balances" /></h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th><Translate component="span" content="account.asset" /></th>
                                <th><Translate component="span" content="account.market_value" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {balances}
                        </tbody>
                    </table>
                </div>
                {/*
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
                 */}
                <div className="content-block">
                <h3><Translate content="account.recent" /> <Link to="account-history" params={{account_name: account_name}}><small> (<Translate content="account.more" />) </small></Link></h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th><Translate content="explorer.block.title" /></th>
                                <th><Translate content="explorer.block.op" /></th>
                                <th><Translate content="account.votes.info" /></th>
                                <th><Translate content="transfer.fee" /></th>
                            </tr>
                        </thead>
                        <tbody>
                        {history}
                        </tbody>
                    </table>
                </div>
            </div>

        );
    }
}

AccountOverview.defaultProps = {
    account_name: "",
    cachedAccounts: {},
    accountHistories: {},
    accountBalances: {},
    account_name_to_id: {},
    assets: null,
    account_id_to_name: {}
};

AccountOverview.propTypes = {
    account_name: PropTypes.string.isRequired,
    cachedAccounts: PropTypes.object.isRequired,
    accountHistories: PropTypes.object.isRequired,
    accountBalances: PropTypes.object.isRequired,
    account_name_to_id: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    account_id_to_name: PropTypes.object.isRequired
};

export default AccountOverview;
