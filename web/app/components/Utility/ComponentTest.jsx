import React, {Component} from "react"
import ChainTypes from "components/Utility/ChainTypes"
import BindToChainState from "components/Utility/BindToChainState"
import Immutable from "immutable"

import AccountStore from "stores/AccountStore"

@BindToChainState()
class ComponentTest extends Component {
    
    static propTypes = {
        linkedAccounts: ChainTypes.ChainAccountsList.isRequired
    }
    
    render() {
        return (
            <ul>
                {this.props.linkedAccounts.filter(a => a).map( a => <li>{a.get("id")} : {a.get("name")}</li>)}
            </ul>
        )
    }

}


class ComponentTestContainer {
    render() {
        return <ComponentTest linkedAccounts={Immutable.List(["init1", "init2", "init3", "nathan"])}/>
    }
}


export default ComponentTestContainer;
