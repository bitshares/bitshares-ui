import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import Operation from "../Blockchain/Operation";
import WitnessStore from "stores/WitnessStore";
import LoadingIndicator from "../LoadingIndicator";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import BalanceComponent from "../Utility/BalanceComponent";

@BindToChainState()
class AccountOverview extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        //accountHistories: PropTypes.object.isRequired,
        //accountBalances: PropTypes.object.isRequired,
        //account_name_to_id: PropTypes.object.isRequired,
        //assets: PropTypes.object.isRequired,
        //account_id_to_name: PropTypes.object.isRequired
    }

    shouldComponentUpdate(nextProps) {
        return true;
        //return (
        //    nextProps.account_name !== this.props.account_name ||
        //    nextProps.cachedAccounts !== this.props.cachedAccounts ||
        //    nextProps.assets !== this.props.assets ||
        //    nextProps.accountBalances !== this.props.accountBalances ||
        //    nextProps.wallet_locked !== this.props.wallet_locked ||
        //    // Object.keys(nextProps.account_id_to_name).equals(Object.keys(this.props.account_id_to_name))
        //    // returning true here until issue #93 has been resolved
        //    true
        //);
    }

    render() {
        let account = this.props.account;
        let balances = null;
        let account_balances = account.get("balances");
        if(account_balances) {
            balances = account_balances.map( balance => {
                return (
                    <tr key={balance}>
                        <td><BalanceComponent balance={balance}/></td>
                        <td><BalanceComponent balance={balance}/></td>
                    </tr>
                );
            });
        }
        let witness_store_state = WitnessStore.getState().witnesses;
        let history = null;
        let account_history = account.get("history");
        if(account_history) {
            history = account_history.take(10).map( t => {
                let trx = t.toJS();
                return (
                    <Operation
                        key={trx.id}
                        op={trx.op}
                        result={trx.result}
                        block={trx.block_num}
                        current={account.get("name")}
                        witnesses={witness_store_state.witnesses}
                        witness_id_to_name={witness_store_state.witness_id_to_name}
                        inverted={this.props.settings.get("inverseMarket")}
                        />
                );
            });
        }
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
                <div className="content-block">
                <h3><Translate content="account.recent" /> <Link to="account-history" params={{account_name: account.get("name")}}><small> (<Translate content="account.more" />) </small></Link></h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th><Translate content="explorer.block.date" /></th>
                                <th><Translate content="explorer.block.op" /></th>
                                <th><Translate content="account.votes.info" /></th>
                                <th style={{paddingRight: "1.5rem", textAlign: "right"}}><Translate content="transfer.fee" /></th>
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

export default AccountOverview;
