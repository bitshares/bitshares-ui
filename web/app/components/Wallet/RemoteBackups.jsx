import React, {Component} from "react";
import {Link} from "react-router"
import connectToStores from "alt/utils/connectToStores"
import WalletActions from "actions/WalletActions"
import WalletDb from "stores/WalletDb"
import WalletManagerStore from "stores/WalletManagerStore"
import WalletUnlock from "components/Wallet/WalletUnlock"
import BalanceClaimByAsset from "components/Wallet/BalanceClaimByAsset"
import Translate from "react-translate-component"
import cname from "classnames"

let token

export default class RemoteBackups extends Component {
    
    static onEnter(nextState, replaceState) {
        token = nextState.params
        if( ! token )
            return
        
        let path = nextState.location.pathname
        path = path.replace(token, "")
        replaceState(null, path)
    }
    
    render() {
        return <WalletUnlock>{ this.render_unlocked() }</WalletUnlock>
    }
    
    render_unlocked() {
        let { wallet } = WalletDb.getState()
        if( token )
            wallet.keepRemoteCopy(null, token)//.then(()=> { })
        
        console.log('wallet storage', wallet.storage.state.toJS())
        return <div>
            // <StrengthenEncryption>
            //     <ChooseBackupServer>
            //         <VerifyUser>
            //             <ToggleRemoteBackups/>
            //         </VerifyUser>
            //     </ChooseBackupServer>
            // </StrengthenEncryption>
        </div>
    }

}

class EnableRemoteBackpus extends Component {
    render() {
        return <div></div>
    }
}

class VerifiedEmail extends Component {
    render() {
        let { wallet } = WalletDb.getState()

        if( wallet.storage.state.has("remote_token") )
            return <div>{ this.props.children }</div>
        
        
    }
}


export class EmailInput extends Component {
    // WalletDb.getState().wallet.api.requestCode("james@jcalfee.info")
    
    
    render() {
        const email_input = <form onSubmit={this.submit.bind(this)}>
            
        </form>
        
        let { wallet } = WalletDb.getState()
        
    }
    
    submit(e) {
        if(e) e.preventDefault()
        
        
    }
    
}