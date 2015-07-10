import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import Operation from "../Blockchain/Operation";
import WitnessStore from "stores/WitnessStore";

class AccountHistory extends React.Component {

    render() {
        let {account_name, cachedAccounts, account_name_to_id, assets, accountHistories, account_id_to_name} = this.props;
        let account = account_name_to_id[account_name] ? cachedAccounts.get(account_name_to_id[account_name]) : null;
        if(!account) return <div>Account {account_name} couldn't be displayed</div>;
        let history = accountHistories.get(account.id).map((trx, index) => {
            return (
                <Operation
                    key={index}
                    op={trx.op}
                    block={trx.block_num}
                    account_id_to_name={account_id_to_name}
                    assets={assets}
                    current={account_name}
                    witnesses={WitnessStore.getState().witnesses}
                    witness_id_to_name={WitnessStore.getState().witness_id_to_name}
                    inverted={this.props.settings.get("inverseMarket")}
                    />
            );
        });
        return (
            <div className="grid-content">
                <div>

                </div>

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
