
import React, {Component} from "react"
import connectToStores from "alt/utils/connectToStores"
import WalletDb from "stores/WalletDb"
import WalletCreate from "components/Wallet/WalletCreate"
import WalletUnlockActions from "actions/WalletUnlockActions"

/**
    This component provides an unlock or cancel (back) button.  Children are shown when unlocked.  If your component depends on WalletDb state changes it will need to listen to the WalletDb store.
*/
@connectToStores
export default class WalletUnlock extends Component {

    static getStores() {
        return [WalletDb]
    }
    
    static getPropsFromStores() {
        return {
        }
    }
    
    // static propTypes = {
    //     UNTESTED If your component depends on WalletDb state changes, then because react assembles all components in the jsx first (even when they may not render), your component may need to monitor the WalletDb store or provide a render function in the renderUnlocked property.
    //     renderUnlocked: React.PropTypes.func
    // }
    
    // shouldComponentUpdate() {
    //     return this.was_empty !== WalletDb.isEmpty() ||
    //         this.was_locked !== WalletDb.isLocked()
    // }
    
    render() {
        this.was_empty = WalletDb.isEmpty()
        if( this.was_empty )
        return <WalletCreate hideTitle={true}/>
        
        this.was_locked = WalletDb.isLocked()
        if( this.was_locked )
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
        // let func = this.props.renderUnlocked
        // return <div>{ func ? func() : this.props.children }</div>
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