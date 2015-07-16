import React,{Component} from "react"
import {Link} from "react-router"
import Panel from "react-foundation-apps/src/panel"
import classNames from "classnames"
import AccountActions from "actions/AccountActions"
import ImportKeys from "components/Wallet/ImportKeys"
import ImportBrainKey from "components/Wallet/ImportBrainKey"

import cname from "classnames"

class ExistingAccount extends Component {
    
    constructor() {
        super()
        this.state = {
            show: null,
            brainkeys:[],
            wif_count: 0
        }
    }
    
    render() {
        return <div className="grid-block page-layout">
            <div className="grid-block vertical medium-9 medium-offset-2">
                
                <h4>Existing Accounts</h4>
                
                <hr/>
                <h3>Gather Private Keys
                    {this.state.wif_count ? ` (${this.state.wif_count})`: ""}
                </h3>
                <ImportKeys setWifCount={this.setWifCount.bind(this)}/> 
                
                <hr/>
                <h3>Load Brain Key</h3>
                <ImportBrainKey/>
                
                <hr/>
                <div>
                    <a className="button"
                        onClick={this.lookupAccounts.bind(this)} >
                        Lookup Accounts
                    </a>
                </div>
            </div>
        </div>
    }
    
    setWifCount(wif_count) {
        console.log('... wif_count',wif_count)
        this.setState({wif_count})
    }
    
    lookupAccounts() {
        
    }
    

}

export default ExistingAccount
