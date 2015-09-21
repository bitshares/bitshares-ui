
import React, {Component, Children} from "react"
import { RouteHandler } from "react-router"
import connectToStores from "alt/utils/connectToStores"
import Immutable from "immutable"
import cname from "classnames"
import key from "common/key_utils"
import dictionary from "common/dictionary_en"
import BrainkeyActions from "actions/BrainkeyActions"
import BrainkeyStoreFactory from "stores/BrainkeyStore"
import BindToChainState from "components/Utility/BindToChainState"
import ChainTypes from "components/Utility/ChainTypes"

var dictionary_set = new Set(dictionary.split(','))

class BrainkeyBaseComponent extends Component {
    static getStores() {
        return [BrainkeyStoreFactory.getInstance("wmc")]
    }
    static getPropsFromStores() {
        var brnkey = BrainkeyStoreFactory.getInstance("wmc").getState()
        return brnkey
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
                <h3>Brainkey</h3>
                <BrainkeyInput>
                    <ViewBrainkey/>
                </BrainkeyInput>
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
            <h5>No Accounts</h5>}
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
        var rows = this.props.accounts.filter( account => !!account )
            .map( account => account.get("name") ).sort()
            .map( name => <AccountCard key={name} account={name}/> )
        return <span>
            {rows}
        </span>
    }

}

class BrainkeyInput extends Component {
    
    constructor() {
        super()
        this.state = { brnkey: "", accept: false }
    }
    
    render() {
        if(this.state.accept)
            return <span>{this.props.children}</span>
        
        var spellcheck_words = this.state.brnkey.split(" ")
        var checked_words = []
        spellcheck_words.forEach( (word, i) => {
            if(word === "") return
            if(dictionary_set.has(word.toLowerCase()))
                checked_words.push(<span key={i}>{word} </span>)
            else 
                checked_words.push(<MissspelledWord key={i}>{word}</MissspelledWord>)
        })
        var ready = checked_words.length > 0
        var word_count_label
        if(checked_words.length > 3)
            word_count_label = "(" + checked_words.length + " words)"
        return (
            <span className="grid-container">
                <div style={{width: '400px'}}>
                    <textarea onChange={this.formChange.bind(this)}
                        value={this.state.brnkey} id="brnkey"
                        style={{width: '400px', height:'80px'}} />
                    <div>{ checked_words }</div>
                    <p>{ word_count_label }</p>
                    <div className={cname("button success", {disabled: ! ready})}
                        onClick={this.onAccept.bind(this)}>Accept</div>
                </div>
            </span>
        )
        
    }
    
    onAccept() {
        this.setState({accept: true})
        BrainkeyActions.setBrainkey(this.state.brnkey)
    }
    
    formChange(event) {
        var {id, value} = event.target
        var state = {}
        state[id] = value // id === "brnkey"
        this.setState(state)
    }
}

class MissspelledWord extends Component {
    render() {
        return <span style={{borderBottom: '1px dotted #ff0000', padding: '1px', margin: '1px'}}>
            <span style={{borderBottom: '1px dotted #ff0000'}}>
                {this.props.children}
            </span>
        </span>
    }
}
// <div onClick={this.onLookupAccounts.bind(this)} className="button success">Lookup Accounts</div>
// onLookupAccounts() {
//     
// }
