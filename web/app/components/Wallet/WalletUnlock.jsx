import React, {Component} from 'react'

import WalletDb from "stores/WalletDb"
import WalletCreate from "components/Wallet/WalletCreate"
import NotificationActions from "actions/NotificationActions"

import cname from "classnames"

export default class WalletUnlock extends Component {

    constructor() {
        super()
        this.state = { 
            password_error: null
        }
    }
    
    render() {
        if (WalletDb.isLocked())
            return <div>
                <form onSubmit={this._passSubmit.bind(this)}
                    className={cname(
                        {"has-error": this.state.password_error}
                    )}
                >
                    <input type="password" placeholder="Wallet Password"
                        onChange={this._passChange.bind(this)}/>
                    <div>{this.state.password_error}</div>
                    <button className="button" onClick={this._passSubmit.bind(this)}>
                        Unlock Wallet
                    </button>
                </form>
            </div>
        
        return <div>
            {this.props.children}
        </div>
    }
    
//   { ! this.props.relock_button ? "" : <div>
//               <button className="button" onClick={this._lock.bind(this)}>
//                   Re-Lock Wallet
//               </button>
//               <br>
//           </div>}

    _passChange(e) {
        this.password_ui = e.target.value
        this.setState({password_error: null})
    }
    
    _passSubmit(e) {
        e.preventDefault()
        WalletDb.validatePassword(
            this.password_ui || "",
            true //unlock
        )
        if( WalletDb.isLocked())
            this.setState({password_error: "Wrong password"})
        else
            this.setState({password_error: null})
    }

    _lock() {
        WalletDb.onLock()
        this.forceUpdate()
    }
    
}
