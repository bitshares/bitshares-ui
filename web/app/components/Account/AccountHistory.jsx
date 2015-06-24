import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import Operation from "../Blockchain/Operation";
import WitnessStore from "stores/WitnessStore";

class AccountHistory extends React.Component {

    render() {
        let {account_name, browseAccounts, account_name_to_id, assets, accountHistories, account_id_to_name} = this.props;
        let account = account_name_to_id[account_name] ? browseAccounts.get(account_name_to_id[account_name]) : null;
        if(!account) return <div>Account {account_name} couldn't be displayed</div>;
        let witness_store_state = WitnessStore.getState().witnesses;
        let history = accountHistories.get(account.id).map((trx, index) => {
            return (
                <Operation
                    key={index}
                    op={trx.op}
                    block={trx.block_num}
                    accounts={account_id_to_name}
                    assets={assets}
                    current={account_name}
                    witnesses={witness_store_state.witnesses}
                    witness_id_to_name={witness_store_state.witness_id_to_name}
                    inverted={this.props.settings.get("inverseMarket")}
                    />
            );
        });
        return (
            <div className="grid-content no-overflow">
                <table style={{width: "100%"}} className="table text-center">
                    <tbody>
                    {history}
                    </tbody>
                </table>
            </div>
        );
    }
}

export default AccountHistory;
