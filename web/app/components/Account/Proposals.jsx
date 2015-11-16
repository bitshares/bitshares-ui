import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import Operation from "components/Blockchain/Operation"
import BindToChainState from "components/Utility/BindToChainState"
import ChainTypes from "components/Utility/ChainTypes"
import utils from "common/utils"

@BindToChainState({keep_updating: true})
export default class Proposals extends Component {

    static propTypes = {
        accountList: ChainTypes.ChainAccountsList.isRequired,
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        // console.log("should render")
        var len1 = this.props.accountList.length
        var len2 = nextProps.accountList.length
        if( len1 !== len2 ) return true
        for(let i = 0; i < len1; i++) {
            var a1 = this.props.accountList[i]
            var a2 = nextProps.accountList[i]
            if( a1 !== a2 ) return true
            if( ! a1 ) continue // undefined or null
            if( a1.get("proposals") !== a2.get("proposals") ) return true
        }
        return false
    }
    
    render() {
        // console.log("render")
        let proposalRows = []
        for(let account of this.props.accountList) {
            if( ! account ) continue
            if( ! account.get("proposals").count() ) continue
            account.get("proposals").forEach( proposal_id => {
                var proposal = ChainStore.getObject( proposal_id )
                if( proposal ) {
                    var proposed_transaction = proposal.get("proposed_transaction")
                    var operations = proposed_transaction.get("operations")
                    <ProposedOperations operations={operations} proposal_id={proposal_id}/>
                    
                }
            })
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
}

class ProposedOperations extends Component {
    render() {
        return (
            <table className={"table compact"}>
                <thead>
                <tr>
                    <th><Translate content="account.votes.info" /></th>
                    <th><Translate content="explorer.block.date" /></th>
                </tr>
                </thead>
                <tbody>
                    {this.props.operations.map( o =>
                        <Operation
                            key={this.props.proposal_id} op={o.toJS()}
                            inverted={false} hideFee={true} hideOpLabel={true}
                        />
                    )}
                </tbody>
            </table>
        );
    }
}
