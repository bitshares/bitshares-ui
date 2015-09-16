import React, {Component} from "react"
import ChainTypes from "components/Utility/ChainTypes"
import BindToChainState from "components/Utility/BindToChainState"
import Immutable from "immutable"

import AccountStore from "stores/AccountStore"

@BindToChainState()
export default class ComponentTest extends Component {
    
    static propTypes = {
        resolvedLinkedAccounts: ChainTypes.ChainAccountsList.isRequired
    }
    
    static defaultProps = {
        resolvedLinkedAccounts: Immutable.List(AccountStore.getState().linkedAccounts)
    }
    
    render() {
        return (
            <span>{this.props.resolvedLinkedAccounts.size}</span>
        )
    }

}
