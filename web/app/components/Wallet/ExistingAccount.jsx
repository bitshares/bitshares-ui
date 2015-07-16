import React,{Component} from "react"
import ImportKeys from "components/Wallet/ImportKeys"
import ImportBrainKey from "components/Wallet/ImportBrainKey"
import Wallet from "components/Wallet/Wallet"
import WalletDb from "stores/WalletDb"

import notify from 'actions/NotificationActions'

class ExistingAccount extends Component {
    
    constructor() {
        super()
        this.state = {
            show: null,
            wif_private_keys: {}
        }
    }
    
    render() {
        var has_keys = Object.keys(this.state.wif_private_keys).length != 0
        return <div className="grid-block page-layout">
            <div className="grid-block vertical medium-9 medium-offset-2">
                
                <h4>Existing Accounts</h4>
                <Wallet>
                    <hr/>
                    <h3>Gather Private Keys</h3>
                    <ImportKeys setWifPrivateKeys={this.setWifPrivateKeys.bind(this)}/> 
                    {has_keys ? <div>
                        <a className="button"
                            onClick={this.importKeys.bind(this)} >
                            Import
                        </a>
                    </div> :""}
                </Wallet>
            </div>
        </div>
    }
    
    setWifPrivateKeys(wif_private_keys) {
        this.setState({wif_private_keys})
    }
    
    importKeys() {
        if( WalletDb.isLocked()) {
            notify.error("Wallet is locked")
            return
        }
        var wif_private_keys = Object.keys(this.state.wif_private_keys)
        WalletDb.importKeys( wif_private_keys ).then( result => {
            var {import_count, duplicate_count, private_key_ids} = result
            
console.log('... wif_private_keys',wif_private_keys)
console.log('... private_key_ids2',private_key_ids)

            var message = ""
            if (import_count)
                message = `Successfully imported ${import_count} keys.`
            if (duplicate_count)
                message += `  ${duplicate_count} duplicates (Not Imported).`
            
            if(duplicate_count)
                notify.warning(message)
            else
                notify.success(message)
            this.reset()
        }).catch( error => {
            notify.error(`There was an error: ${error}`)
        })
    }
    
//                <hr/>
//                <h3>Load Brain Key</h3>
//                <ImportBrainKey/>
}

export default ExistingAccount
