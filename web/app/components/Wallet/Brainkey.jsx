
import React, {Component, Children} from "react"
import { RouteHandler } from "react-router"
import connectToStores from "alt/utils/connectToStores"
import cname from "classnames"
import key from "common/key_utils"
import dictionary from "common/dictionary_en"
import BrainkeyStore from "stores/BrainkeyStore"
import BrainkeyActions from "actions/BrainkeyActions"

var dictionary_set = new Set(dictionary.split(','))

class BrainkeyBaseComponent extends Component {
    
    static getStores() {
        return [BrainkeyStore]
    }
    
    static getPropsFromStores() {
        var brnkey = BrainkeyStore.getState()
        return brnkey
    }
    
}

@connectToStores
export default class Brainkey extends BrainkeyBaseComponent {

    render() {
        return (
            <span>
                    
                <h3>Brainkey</h3>
                
                <BrainkeyInput>
                </BrainkeyInput>
                
            </span>
        )
    }
}

@connectToStores
class ViewBrainkey extends BrainkeyBaseComponent {
    
    render() {
        var short_brnkey = this.props.brnkey.substring(0, 10) + "..."
        return <div>{this.props.brnkey}</div>
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
        
        var spellcheck_words = key.normalize_brain_key(this.state.brnkey).split(' ')
        var checked_words = []
        for(let word of spellcheck_words) {
            if(word === "") continue
            if(dictionary_set.has(word.toLowerCase()))
                checked_words.push(<span>{word} </span>)
            else 
                checked_words.push(<MissspelledWord>{word}</MissspelledWord>)
        }
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
        BrainkeyActions.setBrainKey(this.state.brnkey)
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
