/** Generic set of components for dealing with data in the ChainStore */
import React, {Component, Children} from "react"
import AltContainer from "alt/AltContainer"
import ChainTypes from "components/Utility/ChainTypes"
import BindToChainState from "components/Utility/BindToChainState"
import Immutable from "immutable"

import AccountStore from "stores/AccountStore"

export class ResolveLinkedAccounts extends Component {
    render() {
        return (
            <AltContainer
                stores={[AccountStore]}
                inject={{
                    resolvedLinkedAccounts: () => {
                        var l = Immutable.List(AccountStore.getState().linkedAccounts)
                        console.log("... Immutable.List.isList(l)", Immutable.List.isList(l))
                        return Immutable.List(AccountStore.getState().linkedAccounts)
                    }
                }}>
                <ResolveLinkedAccountsChainState children={this.props.children}/>
            </AltContainer>
        )
    }
}

@BindToChainState()
class ResolveLinkedAccountsChainState extends Component {
    
    static propTypes = {
        resolvedLinkedAccounts: ChainTypes.ChainAccountsList.isRequired
    }

    render() {
        var resolvedLinkedAccounts = []
        this.props.resolvedLinkedAccounts.forEach( account => {
            if( ! account) return
            console.log("... account.toJS()", account.toJS())
            resolvedLinkedAccounts.push(account)
        })
        var child = Children.only(this.props.children)
        if( ! child) return <span>{resolvedLinkedAccounts}</span>
        // Pass the list to a child reactjs component as this.props.resolvedLinkedAccounts
        child = React.addons.cloneWithProps(child, { resolvedLinkedAccounts })
        return <span>{child}</span>
    }
    
}