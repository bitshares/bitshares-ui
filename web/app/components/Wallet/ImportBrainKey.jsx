import React, {Component} from 'react'

export default class ImportBrainKey extends Component {

    constructor() {
        super()
        this.state = { 
            brainkey: "",
        }
        //this.validate()
    }
    
    render() {
        return <div>
            <label>Brain-Key</label>
            <textarea type="text" ref="brainkey"/>
            <div className="button"
                onClick={this._findBrainKeyAccounts.bind(this)}>
                Search for Accounts
            </div>
            <br/>
        </div>
    }
    
    
    _findBrainKeyAccounts() {
       //<a className="button"
       //        onClick={this._brainKeyButton.bind(this)}
        this.setState({has_brainkey:yes})
    }
}
//this.context.router.transitionTo(
//    this.state.has_brainkey ? "create-account")
//   
