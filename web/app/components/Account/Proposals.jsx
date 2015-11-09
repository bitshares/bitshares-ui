import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import AccountStore from "stores/AccountStore"
import Inspector from "react-json-inspector";

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
                    if( proposal ) proposalRows.push(
                        <div>
                            Proposal: {account_name}
                            <Inspector data={ proposal.toObject() } search={false} />
                        </div>
                    )
                })
            }
        }

        return (
            <span>{ proposalRows }</span>
        );
    }
}
