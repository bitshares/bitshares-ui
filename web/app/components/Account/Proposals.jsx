import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import AccountStore from "stores/AccountStore"
import Inspector from "react-json-inspector";
import Operation from "components/Blockchain/Operation"

export default class Proposals extends Component {

    static propTypes = {
        accountNames: PropTypes.object.isRequired
    }
    
    render() {
        let proposalRows = []
        let accountNames = this.props.accountNames || AccountStore.getState().linkedAccounts
        for(let account_name of accountNames) {
            var account = ChainStore.getAccount(account_name)
            if( account && account.get("proposals").count() ) {
                account.get("proposals").forEach( proposal_id => {
                    var proposal = ChainStore.getObject( proposal_id )
                    if( proposal ) {
                        var proposed_transaction = proposal.get("proposed_transaction")
                        var operations = proposed_transaction.get("operations")
                        operations.forEach( o => {
                            proposalRows.push(
                                <Operation
                                    key={proposal_id} op={o.toJS()}
                                    inverted={false} hideFee={true} hideOpLabel={true}
                                />
                            )
                        })
                    }
                })
            }
        }

        return (
            <table className={"table compact"}>
                <thead>
                <tr>
                    <th><Translate content="account.votes.info" /></th>
                    <th><Translate content="explorer.block.date" /></th>
                </tr>
                </thead>
                <tbody>
                    { proposalRows }
                </tbody>
            </table>
        );
    }
}/*  
                                    <Inspector data={ o.toJS() } search={false} />
*/
