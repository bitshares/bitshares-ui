import React, {Component} from 'react'

import WalletActions from "actions/WalletActions"

import key from "common/key_utils"

export default class ImportBrainKey extends Component {

    constructor() {
        super()
        this.state = { 
            brainkey: "",
        }
    }
    
    render() {
        return <div>
            <label>Brain-Key</label>
            <textarea type="text" 
                onChange={this.brainkey.bind(this)}
                value={this.state.brainkey} />
            
            <div className="button"
                onClick={this._findBrainKeyAccounts.bind(this)} >
                Search for Accounts
            </div>
            <br/>
        </div>
    }
    
    brainkey() {
        this.setState({brainkey})
    }
    
    _findBrainKeyAccounts() {
        WalletActions.findAccountsByBrainKey(this.state.brainkey).then(
            accounts => {})
        this.setState({})
    }
}

ImportBrainKey.propTypes = {
    hasAccount: React.PropTypes.object.isRequired
}
