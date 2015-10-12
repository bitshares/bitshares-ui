
import React, {Component, Children} from "react"
import { RouteHandler } from "react-router"
import connectToStores from "alt/utils/connectToStores"
import Immutable from "immutable"
import cname from "classnames"
import key from "common/key_utils"
import BrainkeyActions from "actions/BrainkeyActions"
import BrainkeyStoreFactory from "stores/BrainkeyStore"
import BindToChainState from "components/Utility/BindToChainState"
import ChainTypes from "components/Utility/ChainTypes"
import BrainkeyInput from "components/Wallet/BrainkeyInput"
import _ from "lodash"
import Translate from "react-translate-component";

class BrainkeyBaseComponent extends Component {
    static getStores() {
        return [BrainkeyStoreFactory.getInstance("wmc")]
    }
    static getPropsFromStores() {
        var props = BrainkeyStoreFactory.getInstance("wmc").getState()
        return props
    }
}

@connectToStores
export default class Brainkey extends BrainkeyBaseComponent {
    componentWillUnmount() {
        console.log("brnkey componentWillUnmount");
        BrainkeyStoreFactory.closeInstance("wmc")
    }
    render() {
        return (
            <span>
                <h3><Translate content="wallet.brainkey" /></h3>
                <BrainkeyInputAccept>
                    <ViewBrainkey/>
                </BrainkeyInputAccept>
            </span>
        )
    }
}

@connectToStores
class ViewBrainkey extends BrainkeyBaseComponent {
    render() {
        var short_brnkey = this.props.brnkey.substring(0, 10)
        console.log("this.props.account_ids.toArray()", this.props.account_ids.toArray())
        return <span>
            <div><span className="">{short_brnkey}</span>&hellip;</div>
            <p></p>
            {this.props.account_ids.size?
            <BrainkeyAccounts accounts={Immutable.List(this.props.account_ids.toArray())}/>:
            <h5><Translate content="wallet.no_accounts" /></h5>}
        </span>
    }
}

import AccountCard from "components/Dashboard/AccountCard"
@BindToChainState({keep_updating: true})
class BrainkeyAccounts {

    static propTypes = {
        accounts: ChainTypes.ChainAccountsList.isRequired
    }
    
    render() {
        var rows = _.pairs(this.props.accounts).filter( account => !!account[1] )
            .map( account => account[1].get("name") ).sort()
            .map( name => <AccountCard key={name} account={name}/> )
        return <span>
            {rows}
        </span>
    }

}

export class BrainkeyInputAccept extends Component {
    
    constructor() {
        super()
        this.state = { brnkey: "", accept: false }
    }
    
    render() {
        if(this.state.accept)
            return <span>{this.props.children}</span>
        var ready = this.state.brnkey && this.state.brnkey !== ""
        return (
            <span className="grid-container">
                <div style={{width: '400px'}}>
                    <BrainkeyInput onChange={this.onBrainkeyChange.bind(this)}/>
                </div>
                <div className={cname("button success", {disabled: ! ready})}
                    onClick={this.onAccept.bind(this)}><Translate content="wallet.accept" /></div>
            </span>
        )
    }
    
    onBrainkeyChange(brnkey) {
        this.setState({ brnkey })
    }

    onAccept() {
        this.setState({accept: true})
        BrainkeyActions.setBrainkey(this.state.brnkey)
    }

}

// <div onClick={this.onLookupAccounts.bind(this)} className="button success">Lookup Accounts</div>
// onLookupAccounts() {
//     
// }
