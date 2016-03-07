import React, {Component} from "react";
import {Link} from "react-router"
import connectToStores from "alt/utils/connectToStores"
import WalletActions from "actions/WalletActions"
import WalletDb from "stores/WalletDb"
import WalletManagerStore from "stores/WalletManagerStore"
import BalanceClaimByAsset from "components/Wallet/BalanceClaimByAsset"
import Translate from "react-translate-component"
import cname from "classnames"

class WalletBaseComponent extends Component {

    static getStores() {
        return [WalletManagerStore, WalletDb]
    }

    static getPropsFromStores() {
        var wallet = WalletManagerStore.getState()
        var ww = WalletDb.getState()
        wallet.current_wallet = ww.current_wallet
        wallet.wallet_names = ww.wallet_names
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
                            {this.props.children}
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
        let box_style = {width: "120px", height: "90px"}
        return <span>
            <div className="grid-block">
                
                {has_wallet ? <div className="grid-content">
                    <div className="card">
                        <div className="card-content" style={box_style}>
                                <label><Translate content="wallet.active_wallet" />:</label>
                                <div>{current_wallet}</div>
                                <br/>
                                {has_wallets ? (
                                    <Link to="/wallet/change">
                                        <div className="button outline success">
                                            <Translate content="wallet.change_wallet" />
                                        </div>
                                    </Link>
                                )
                                :null}
                        </div>
                    </div>
                </div>:null}

                {has_wallet ? <div className="grid-content">
                    <div className="card">
                        <div className="card-content" style={box_style}>
                                <label><Translate content="wallet.import_keys_tool" /></label>
                                <div style={{visibility: "hidden"}}>Dummy</div>
                                <br/>
                                {has_wallet ? (
                                    <Link to="/wallet/import-keys">
                                        <div className="button outline success">
                                            <Translate content="wallet.import_keys" />
                                        </div>
                                    </Link>
                                )
                                :null}
                        </div>
                    </div>
                </div>:null}
                
                {has_wallet ? <div className="grid-content">
                    <div className="card">
                        <div className="card-content" style={box_style}>
                            <label><Translate content="wallet.balance_claims" /></label>
                            <div style={{visibility: "hidden"}}>Dummy</div>
                            <br/>
                            <Link to="wallet/balance-claims">
                                <div className="button outline success">
                                    <Translate content="wallet.balance_claim_lookup" />
                                </div>
                            </Link>
                        {/*<BalanceClaimByAsset>
                            <br/>
                            <div className="button outline success">
                                <Translate content="wallet.balance_claims" /></div>
                        </BalanceClaimByAsset>
                        */}
                        </div>
                    </div>
                </div>:null}
            
            </div>
            
            {has_wallet ? <div></div> : null}
            
            <Link to="wallet/create">
            <div className="button outline success"><Translate content="wallet.new_wallet" /></div></Link>
            
            {has_wallet ? <Link to="wallet/delete">
            <div className="button outline success"><Translate content="wallet.delete_wallet" /></div></Link>:null}

            {has_wallet ? <Link to="wallet/change-password">
            <div className="button outline success"><Translate content="wallet.change_password" /></div></Link>:null}
            
            
            {has_wallet ? <span><br/><br/></span> : null}
            
            <Link to="wallet/backup/server">
            <div className="button outline success"><Translate content="wallet.server_backup" /></div></Link>
                
            {has_wallet ? <Link to="wallet/backup/brainkey">
            <div className="button outline success"><Translate content="wallet.backup_brainkey" /></div></Link>:null}

            <Link to="wallet/backup/restore">
            <div className="button outline success"><Translate content="wallet.import_backup" /></div></Link>
            
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
        if(this.props.wallet_names.count() === 1)
            return <label>{this.state.current_wallet}</label>

        var options = []
        this.props.wallet_names.forEach( wallet_name => {
            options.push(<option key={wallet_name} value={wallet_name}>{wallet_name.toUpperCase()}</option>)
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

@connectToStores
export class WalletDelete extends WalletBaseComponent {

    constructor() {
        super()
        this.state = {
            selected_wallet: null,
            confirm: 0
        }
    }
    
    render() {
        if(this.state.confirm === 1) {
            return <div>
                <h4><Translate content="wallet.delete_confirm_line1"/></h4>
                <p><Translate content="wallet.delete_confirm_line2"/>
                <br/><Translate content="wallet.delete_confirm_line3"/></p>
                <br/>
                <div className="button success" onClick={this.onConfirm2.bind(this)}>
                    <Translate content="wallet.delete_wallet_name" name={this.state.selected_wallet} /></div>
                <Cancel/>
            </div>
        }
        
        
        // this.props.current_wallet
        var placeholder = <option key="placeholder" value="" disabled={this.props.wallet_names.size > 1}></option>
        // if (this.props.wallet_names.size > 1) {
        //     placeholder = <option value="" disabled>{placeholder}</option>;
        // }
        // else {
        //     //When disabled and list_size was 1, chrome was skipping the 
        //     //placeholder and selecting the 1st item automatically (not shown)
        //     placeholder = <option value="">{placeholder}</option>;
        // }
        var options = [placeholder]
        options.push(<option key="select_option" value="">Select Wallet&hellip;</option>)
        this.props.wallet_names.forEach( wallet_name => {
            options.push(<option key={wallet_name} value={wallet_name}>{wallet_name.toUpperCase()}</option>)
        })

        var is_dirty = !!this.state.selected_wallet

        return <div className="">
            <select 
                value={this.state.selected_wallet}
                className="form-control  account-select"
                style={{margin: '0 auto'}}
                onChange={this.onChange.bind(this)}
            >
                { options }
            </select>
            <br/>
            <div className={ cname("button success", {disabled: !is_dirty}) } onClick={this.onConfirm.bind(this)}>
                <Translate content="wallet.delete_wallet" /></div>
            <Cancel/>
        </div>
    }
    
    onConfirm() {
        this.setState({ confirm: 1 })
    }
    
    onConfirm2() {
        WalletManagerStore.onDeleteWallet(this.state.selected_wallet)
        window.history.back()
    }

    onChange(event) {
        var selected_wallet = event.target.value
        this.setState({selected_wallet})
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