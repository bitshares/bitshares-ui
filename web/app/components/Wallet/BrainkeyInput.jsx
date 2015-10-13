import React, {PropTypes, Component} from "react"
import cname from "classnames"
import hash from "common/hash"
import Translate from "react-translate-component";
import dictionary from "common/dictionary_en"

var dictionary_set = new Set(dictionary.split(','))

export default class BrainkeyInput extends Component {
    
    static propTypes = {
        onChange: PropTypes.func.isRequired
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
                checked_words.push(<MisspelledWord key={i}>{word}</MisspelledWord>)
        })
        // this.ready = checked_words.length > 0
        var word_count_label
        var warn = true
        if(checked_words.length > 0) {
            if(this.state.brnkey.length < 50)
                word_count_label = this.state.brnkey.length + " characters (50 minimum)"
            else {
                if(checked_words.length < 16)
                    word_count_label = checked_words.length + " words (16 recommended)"
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
                    { this.state.check_digits && ! this.props.hideCheckDigits ? <div>
                        <br/>
                        <pre className="no-overflow">{this.state.check_digits} * Check Digits</pre>
                        <br/>
                    </div>:null}
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
            state.check_digits = brnkey.length < 50 ? null :
                hash.sha1(brnkey).toString('hex').substring(0,4)
        }
        this.setState(state)
    }
}

class MisspelledWord extends Component {
    render() {
        return <span style={{borderBottom: '1px dotted #ff0000', padding: '1px', margin: '1px'}}>
            <span style={{borderBottom: '1px dotted #ff0000'}}>
                {this.props.children}
            </span>
        </span>
    }
}
