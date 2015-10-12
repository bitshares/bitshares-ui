import React from "react";
import Translate from "react-translate-component";
import Operation from "../Blockchain/Operation";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";

function compareOps(b, a) {
    if(a.block_num < b.block_num) return -1;
    if(a.block_num === b.block_num) {
        if(a.trx_in_block < b.trx_in_block) return -1;
        if(a.trx_in_block === b.trx_in_block) {
            if(a.op_in_trx < b.op_in_trx) return -1;
            if(a.op_in_trx === b.op_in_trx) return 0;
        }
    }
    return 1;
}

@BindToChainState({keep_updating: true})
class RecentTransactions extends React.Component {

    static propTypes = {
        accountsList: ChainTypes.ChainAccountsList.isRequired,
        compactView: React.PropTypes.bool,
        limit: React.PropTypes.number.isRequired
    }

    shouldComponentUpdate(nextProps, nextState) {
        if(!utils.are_equal_shallow(this.props.accountsList, nextProps.accountsList)) return true;
        if (nextProps.limit !== this.props.limit) return true;
        for(let key = 0; key < nextProps.accountsList.length; ++key) {
            let npa = nextProps.accountsList[key];
            let nsa = this.props.accountsList[key];
            if(npa && nsa && (npa.get("history") !== nsa.get("history"))) return true;
        }
        return false;
    }

    render() {
        let {accountsList, compactView, limit} = this.props;
        let history = [];
        let current_account = null, current_account_id = null;
        let accounts_counter = 0;
        var seen_ops = new Set();
        for(let account of accountsList) {
            accounts_counter += 1;
            if(account) {
                current_account = account;
                let h = account.get("history");
                if (h) history = history.concat(h.toJS().filter(op => !seen_ops.has(op.id) && seen_ops.add(op.id)));
            }
        }
        if(accounts_counter === 1 && current_account) current_account_id = current_account.get("id");
        history = history
            .sort(compareOps)
            .slice(0, limit)
            .map(o => {
                return (
                    <Operation
                        key={o.id}
                        op={o.op}
                        result={o.result}
                        block={o.block_num}
                        current={current_account_id}
                        inverted={false}
                        hideFee={true}
                        hideOpLabel={compactView}
                    />
                )
        });
        return (
            <table className={"table" + (compactView ? " compact" : "")}>
                <thead>
                <tr>
                    {compactView ? null : <th><Translate content="explorer.block.op" /></th>}
                    <th><Translate content="account.votes.info" /></th>
                    <th><Translate content="explorer.block.date" /></th>
                </tr>
                </thead>
                <tbody>
                    {history}
                </tbody>
            </table>
        );
    }
}

export default RecentTransactions;
