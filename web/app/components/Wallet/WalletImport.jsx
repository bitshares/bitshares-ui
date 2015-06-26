import React, {Component, Children} from "react"
import PrivateKey from "ecc/key_private"

var wif_regex = /5[HJK][1-9A-Za-z]{49}/g

export default class WalletImport extends Component {
    
    constructor() {
        super()
        this.state = this.getInitialState()
    }
    
    getInitialState() {
        return {
            wif_private_keys: [],
            import_confirmed: false
        }
    }
    
    shouldComponentUpdate() {
        return true
    }
    
    render() {
        return <div>
            <label>
                IMPORT PRIVATE KEYS ({wallet_public_name})
                {this.renderBody()}
            </label>
        </div>
    }
    
    renderBody() {
        var keys = { valid: [], invalid: [] }
        for(let key of this.state.wif_private_keys) {
            try {
                PrivateKey.fromWif(key)
                keys.valid.push(key)
            } catch (e) {
                keys.invalid.push(key)
            }
        }
        
        if(keys.valid.length == 0)
        return <div>
            <input
                type="file" id="file_input"
                onChange={this.upload.bind(this)}
            />
            <KeyPreview keys={keys}/>
        </div>
        
        if( ! this.state.import_confirmed)
        return <div>
            { keys.valid.length == 0 ? null :
                <button className="button"
                    onClick={this.confirm_import.bind(this)} 
                    enabled={this.state.wif_private_keys.length > 0}
                >
                    IMPORT
                </button>
            }
            <button className="button" onClick={this.discard.bind(this)}>
                DISCARD
            </button>
            <KeyPreview keys={keys}/>
        </div>
        
        return <div>
            <KeyPreview keys={keys}/>
        </div>
    }
    
    upload(evt) {
        var file = evt.target.files[0]
        var reader = new FileReader()
        reader.onload = evt => {
            var contents = evt.target.result
            var wif_private_keys = contents.match(wif_regex)
            if( ! wif_private_keys)
                wif_private_keys = []
            
            this.setState({wif_private_keys})
        }
        reader.readAsText(file)
    }
    
    confirm_import() {
        console.log("TODO: Add 1 entry for Back button support")
        this.setState({import_confirmed:true})
    }
    
    discard() {
        this.setState({wif_private_keys:[]})
    }
    
}

class KeyPreview extends Component {

    render() {
        return <Row>
            <Column>{this.renderByType('valid')}</Column>
            <Column>{this.renderByType('invalid')}</Column>
        </Row>
    }
    
    renderByType(type) {
        var keys = this.props.keys
        return <div>
            <label>{type} Keys ({keys[type].length})</label>
    
            { keys[type].map( key => {
                if(key.length > 7)
                    // show just enough for debugging
                    key = key.substring(0, 7)
                
                return <div> <pre>{key}&hellip;</pre> </div>
            })}
        </div>
    }
    
}

class Importer extends Component {
    
    render() {
        var child = Children.only(this.props.children)
        
    }
    
}

// move to new file
class Row extends Component {
    render() {
        return <div className="grid-block page-layout transfer-bottom small-horizontal">
            {this.props.children}
        </div>
    }
}

// move to new file
class Column extends Component {
    render() {
        return <div className="grid-block medium-3">
            <div className="grid-content">
                {this.props.children}    
            </div>
        </div>
    }
}
