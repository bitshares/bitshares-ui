import React, {Component} from "react";
import {Link, RouteHandler} from "react-router"
import connectToStores from "alt/utils/connectToStores"
import WalletActions from "actions/WalletActions"
import WalletManagerStore from "stores/WalletManagerStore"
import BalanceClaimActive from "components/Wallet/BalanceClaimActive"
import Translate from "react-translate-component";

class WalletBaseComponent extends Component {

    static getStores() {
        return [WalletManagerStore]
    }

    static getPropsFromStores() {
        var wallet = WalletManagerStore.getState()
        return wallet
    }

}

@connectToStores
export default class WalletManager extends WalletBaseComponent {

    render() {
        return (
            <div className="grid-block vertical">
                <div className="grid-container">
                    <div className="content-block center-content">
                        <div className="page-header">
                            <h3><Translate content="wallet.console" /></h3>
                        </div>
                        <div className="content-block">
                            <RouteHandler/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

@connectToStores
export class WalletOptions extends WalletBaseComponent {

    render() {
        var has_wallet = !!this.props.current_wallet
        var has_wallets = this.props.wallet_names.size > 1
        var current_wallet = this.props.current_wallet ? this.props.current_wallet.toUpperCase() : ""
        return <span>

            <span>
            <h5><Translate content="wallet.active_wallet" /></h5>
            <div>{current_wallet}</div>
            <br/>
            </span>

            {has_wallets ? <Link to="wmc-change-wallet">
            <div className="button success"><Translate content="wallet.change_wallet" /></div></Link>:null}
                
            {has_wallet ? <Link to="wmc-backup-create">
            <div className="button success"><Translate content="wallet.create_backup" /></div></Link>:null}

            <Link to="wmc-backup-verify-restore">
            <div className="button success"><Translate content="wallet.restore_backup" /></div></Link>
            
            <Link to="wmc-change-password">
            <div className="button success"><Translate content="wallet.change_password" /></div></Link>

            {has_wallet ? <Link to="wmc-import-keys">
            <div className="button success"><Translate content="wallet.import_keys" /></div></Link>:null}

            <Link to="wmc-brainkey">
            <div className="button success"><Translate content="wallet.brainkey" /></div></Link>

            <Link to="wmc-wallet-create">
            <div className="button success"><Translate content="wallet.new_wallet" /></div></Link>

            <hr/>
            <BalanceClaimActive/>
            
        </span>
    }

}

@connectToStores
export class ChangeActiveWallet extends WalletBaseComponent {

    constructor() {
        super()
        this.state = { }
    }

    componentWillMount() {
        var current_wallet = this.props.current_wallet
        this.setState({current_wallet})
    }

    render() {
        var state = WalletManagerStore.getState()
        if(state.wallet_names.count() === 1)
            return <label>{this.state.current_wallet}</label>

        var options = []
        state.wallet_names.forEach( wallet_name => {
            options.push(<option value={wallet_name}>{wallet_name.toUpperCase()}</option>)
        })

        var is_dirty = this.state.current_wallet !== this.props.current_wallet

        return <div className="">
            <select value={this.state.current_wallet}
                className="form-control account-select"
                style={{margin: '0 auto'}}
                onChange={this.onChange.bind(this)}>{ options }</select>
            <br/>
            { is_dirty ? <div className="button success"
                onClick={this.onConfirm.bind(this)}><Translate content="wallet.change" name={this.state.current_wallet} /></div> :null}
            <Cancel/>
        </div>
    }

    onConfirm() {
        WalletActions.setWallet(this.state.current_wallet)
        window.history.back()
    }

    onChange(event) {
        var current_wallet = event.target.value
        this.setState({current_wallet})
    }

}

class Cancel extends Component {
    
    render() {
        var label = <Translate content="wallet.cancel" />
        return  <span className="button cancel"
            onClick={this.onReset.bind(this)}>{label}</span>
    }
    
    onReset() {
        window.history.back()
    }
}