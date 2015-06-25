import React, {Component} from "react";
import PrivateKey from "ecc/key_private"

var wif_regex = /5[HJK][1-9A-Za-z]{49}/g

class Import extends Component {
    
    constructor() {
        super()
        this.state = {
            wif_private_keys: []
        }
    }
    
    shouldComponentUpdate() {
        console.log('... shouldComponentUpdate')
        return true
    }
    
    render() {
        if(this.state.wif_private_keys.length == 0)
            return <div>
                <input type="file" id="file_input" onChange={this.upload}/>
            </div>
        
        key_rows = []
        for(let key of this.state.wif_private_keys){
            var valid
            try {
                PrivateKey.fromWif(key)
                valid = true
            } catch (e) {
                valid = false
            }
            if(key.length > 7)
                key = key.substring(0, 7) + "..."
            
            key_rows.push(
                <div class={valid ? 'valid_key' : 'invalid_key'}>{key}</div>
            )
        }
        return <div>
            <p>Found {this.state.wif_private_keys.length} keys</p>
            {key_rows.join("\n<br/>")}
        </div>
    }
    
    upload(evt) {
        var file = evt.target.files[0]
        var reader = new FileReader()
        reader.onload = evt => {
            var contents = evt.target.result
            var wif_private_keys = contents.match(wif_regex)
            this.setState({wif_private_keys})
        }
        reader.readAsText(file)
    }
}

export default Import
