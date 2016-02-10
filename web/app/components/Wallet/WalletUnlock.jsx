
import React, {Component} from "react"
import connectToStores from "alt/utils/connectToStores"
import WalletDb from "stores/WalletDb"
import WalletCreate from "components/Wallet/WalletCreate"
import WalletUnlockActions from "actions/WalletUnlockActions"

@connectToStores
export default class WalletUnlock extends Component {

    static getStores() {
        return [WalletDb]
    }
    
    static getPropsFromStores() {
        return {
        }
    }
    
    render() {
        if( WalletDb.isEmpty())
        return <WalletCreate hideTitle={true}/>

        if( WalletDb.isLocked() )
        return <div className="center-content" style={{width: "100%"}}>
            <div className="button-group content-block">
                <a href className="button success" onClick={this.unlock.bind(this)}>
                    Unlock
                </a>
                <a href className="button secondary" onClick={this.back.bind(this)}>
                    Cancel
                </a>
            </div>
        </div>
        
        return <div>{ this.props.children }</div>
    }

    unlock(e) {
        e.preventDefault()
        WalletUnlockActions.unlock()
    }
    
    back(e) {
        e.preventDefault()
        window.history.back()
    }

}