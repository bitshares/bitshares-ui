import React, {Component} from "react"
import PrivateKey from "ecc/key_private"
import Selector from "./Selector"

var wif_regex = /5[HJK][1-9A-Za-z]{49}/g

class Import extends Component {
    
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
        var key_rows = []
        var valid_count = 0
        for(let key of this.state.wif_private_keys){
            var valid
            try {
                PrivateKey.fromWif(key)
                valid = true
                valid_count += 1
            } catch (e) {
                valid = false
            }
            if(key.length > 7)
                key = key.substring(0, 7)
            
            key_rows.push(
                <div className={valid ? 'valid_key' : 'invalid_key'}>
                    <pre>{key}&hellip;</pre>
                </div>
            )
        }
        
        if(this.state.wif_private_keys.length == 0)
        return <input
            type="file" id="file_input"
            onChange={this.upload.bind(this)}
        />
        
        if( ! this.state.import_confirmed)
        return <div>
            { valid_count == 0 ? null :
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
            <p>Found {valid_count} valid keys</p>
            {key_rows}
        </div>
    
        return <Selector/>
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
            //this.forceUpdate()
        }
        reader.readAsText(file)
    }
    
    confirm_import() {
        this.setState({import_confirmed:true})
    }
    
    discard() {
        this.setState({wif_private_keys:[]})
    }
    
}

export default Import
