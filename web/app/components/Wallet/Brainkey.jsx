
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
import _ from "lodash"
import Translate from "react-translate-component";

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
        var rows = _.pairs(this.props.accounts).filter( account => !!account[1] )
            .map( account => account[1].get("name") ).sort()
            .map( name => <AccountCard key={name} account={name}/> )
        return <span>
            {rows}
        </span>
    }

}

export class BrainkeyInput extends Component {
    
    static propTypes = {
        onChange: React.PropTypes.func.isRequired
    }
    
    constructor() {
        super()
        this.state = { brnkey: "" }
    }
    
    render() {
        var spellcheck_words = this.state.brnkey.split(" ")
        var checked_words = []
        spellcheck_words.forEach( (word, i) => {
            if(word === "") return
            var spellcheckword = word.toLowerCase()
            spellcheckword = spellcheckword.match(/[a-z]+/) //just spellcheck letters
            if(spellcheckword === null || dictionary_set.has(spellcheckword[0]))
                checked_words.push(<span key={i} style={{padding: '1px', margin: '1px'}}>{word}</span>)
            else 
                checked_words.push(<MissspelledWord key={i}>{word}</MissspelledWord>)
        })
        // this.ready = checked_words.length > 0
        var word_count_label
        var warn = true
        if(checked_words.length > 0) {
            if(this.state.brnkey.length < 50)
                word_count_label = this.state.brnkey.length + " characters (50 minimum)"
            else {
                if(checked_words.length < 17)
                    word_count_label = checked_words.length + " words (17 recommended)"
                else {
                    word_count_label = checked_words.length + " words"
                    warn = false
                }
            }
        }
        return (
            <span className="">
                <div style={{width: '400px'}}>
                    <textarea onChange={this.formChange.bind(this)}
                        value={this.state.brnkey} id="brnkey"
                        style={{width: '400px', height:'80px'}} />
                    <div className="grid-block">{ checked_words }</div>
                    <br/>
                    <p><i className={cname({error: warn})}>{ word_count_label }</i></p>
                </div>
            </span>
        )

    }

    formChange(event) {
        var {id, value} = event.target
        var state = {}
        state[id] = value
        if(id === "brnkey") {
            var brnkey = key.normalize_brain_key(value)
            this.props.onChange( brnkey.length < 50 ? null : brnkey )
        }
        this.setState(state)
    }
}

class BrainkeyInputAccept extends Component {
    
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
                    <div className={cname("button success", {disabled: ! ready})}
                        onClick={this.onAccept.bind(this)}><Translate content="wallet.accept" /></div>
                </div>
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
