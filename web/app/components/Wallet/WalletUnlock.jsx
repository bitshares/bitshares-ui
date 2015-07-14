import React, {Component} from 'react'

import WalletDb from "stores/WalletDb"
import WalletCreate from "components/Wallet/WalletCreate"

import cname from "classnames"

export default class WalletUnlock extends Component {

    constructor() {
        super()
        this.state = { 
            password_error: null
        }
    }
    
    render() {
        if ( ! WalletDb.getWallet())
            return <WalletCreate/>
        
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
                <br/>
                { ! this.props.render_when_locked ? "" : <div>
                    <div wallet_is_locked={ WalletDb.isLocked() }>
                        {this.props.children}
                    </div>
                    <br/>
                </div>}
            </div>
        
        //TODO, wallet_is_locked property is not seen by children (like ImportKeys)
        //<div wallet_is_locked={ WalletDb.isLocked() }>
        return <div>
            { ! this.props.relock_button ? "" : <div>
                <button className="button" onClick={this._lock.bind(this)}>
                    Re-Lock Wallet
                </button>
            </div>}
            <br/>
            <div wallet_is_locked={ WalletDb.isLocked() }>
                {this.props.children}
            </div>
            <br/>
        </div>
            
    }
    
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
        //this.props.
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

WalletUnlock.propTypes = {
    render_when_locked: React.PropTypes.bool,
    relock_button: React.PropTypes.bool
}
