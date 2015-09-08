import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import Operation from "../Blockchain/Operation";
import WitnessStore from "stores/WitnessStore";
import LoadingIndicator from "../LoadingIndicator";
import BalanceComponent from "../Utility/BalanceComponent";

class AccountOverview extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired
    }

    shouldComponentUpdate(nextProps) {
        return true;
    }

    render() {
        let account = this.props.account;
        let balances = {};
        let account_balances = account.get("balances");
        if(account_balances) {
            account_balances.forEach( balance => {
                balances[balance] = (
                    <tr key={balance}>
                        <td><BalanceComponent balance={balance}/></td>
                        <td><BalanceComponent balance={balance}/></td>
                    </tr>
                );
            })
        }
        let witness_store_state = WitnessStore.getState().witnesses;
        let history = {};
        let account_history = account.get("history");
        if(account_history) {
            account_history.take(20).forEach( t => {
                let trx = t.toJS();
                history[trx.id] = (
                    <Operation
                        key={trx.id}
                        op={trx.op}
                        result={trx.result}
                        block={trx.block_num}
                        current={account.get("id")}
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
                            {React.addons.createFragment(balances)}
                        </tbody>
                    </table>
                </div>
                <div className="content-block">
                <h3><Translate content="account.recent" /> <small> (<Translate content="account.more" /> TODO)</small></h3>
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
                        {React.addons.createFragment(history)}
                        </tbody>
                    </table>
                </div>
            </div>

        );
    }
}

export default AccountOverview;
