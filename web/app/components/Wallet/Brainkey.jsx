
import React, {Component} from "react"

export class ImportBrainkey extends Component {
    
    constructor() {
        super()
        this.state = {}
    }
    
    render() {
        return (
            <span>
                <label>Brainkey</label>
                <input onChange={this.formChange.bind(this)} type="text" value={this.state.brainkey}/>
                <div onClick={this.onLookupAccounts.bind(this)} className="button success">Lookup Accounts</div>
            </span>
        )
    }
    
    onLookupAccounts() {
        
    }
    
    formChange(event) {
        var {id, value} = event.target
        var state = {}
        state[id] = value
        this.setState(state)
    }
}