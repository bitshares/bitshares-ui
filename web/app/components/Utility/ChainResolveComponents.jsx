/** Generic set of components for dealing with data in the ChainStore */
import React, {Component, Children} from "react"
import connectToStores from "alt/utils/connectToStores";
import ChainTypes from "components/Utility/ChainTypes"
import BindToChainState from "components/Utility/BindToChainState"
import Immutable from "immutable"
import AccountStore from "stores/AccountStore"
import _ from "lodash"

@connectToStores
export class ResolveLinkedAccounts extends Component {
    static getStores() {
        return [AccountStore]
    }
    static getPropsFromStores() {
        return AccountStore.getState()
    }
    render() {
        return <ResolveLinkedAccountsChainState
            linkedAccounts={this.props.linkedAccounts}
            children={this.props.children}/>
    }
}

@BindToChainState()
class ResolveLinkedAccountsChainState extends Component {

    static propTypes = {
        linkedAccounts: ChainTypes.ChainAccountsList.isRequired
    }

    render() {
        var linkedAccounts = []
        _.pairs(this.props.linkedAccounts).forEach( account => {
            if( !account[1]) return
            console.log("... account.toJS()", account[1].toJS())
            linkedAccounts.push(account[1])
        })
        var child = Children.only(this.props.children)
        if( ! child) return <span>{linkedAccounts.map(a => <br>{a.toJS()}</br>)}</span>
        // Pass the list to a child reactjs component as this.props.resolvedLinkedAccounts
        child = React.addons.cloneWithProps(child, { linkedAccounts })
        return <span>{child}</span>
    }

}
