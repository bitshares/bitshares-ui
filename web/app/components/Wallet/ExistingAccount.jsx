import React,{Component} from "react"
import ImportKeys from "components/Wallet/ImportKeys"
//import Wallet from "components/Wallet/Wallet"

class ExistingAccount extends Component {
    
    constructor() {
        super()
        this.state = {}
    }
    
    render() {
        return <div className="grid-block page-layout">
            <div className="grid-block vertical medium-9 medium-offset-2">
                <h4>Existing Accounts</h4>
                <ImportKeys/>
            </div>
        </div>
    }
    

}

export default ExistingAccount
