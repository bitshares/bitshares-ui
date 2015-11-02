import React, {Component} from "react"
import Modal from "react-foundation-apps/src/modal"
import ZfApi from "react-foundation-apps/src/utils/foundation-api"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletDb from "stores/WalletDb"

export default class PrivateKeyView extends Component {
    
    static propTypes = {
        pubkey: React.PropTypes.string.isRequired
    }
    
    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return { wif: null }
    }
    
    reset() {
        this.setState(this._getInitialState())
    }
    
    componentDidMount() {
        var modalId = "key_view_modal" + this.props.pubkey
        let modal = React.findDOMNode(this.refs[modalId])
        ZfApi.subscribe(modalId, (name, msg) => {
            if(name !== modalId) return
            if(msg === "close") this.reset()
        })
    }
    
    render() {
        var modalId = "key_view_modal" + this.props.pubkey
        var keys = PrivateKeyStore.getState().keys
        var has_private = keys.has(this.props.pubkey)
        if( ! has_private) return <span>{this.props.children}</span>
        var key = keys.get(this.props.pubkey)
        return <span>
            <a onClick={this.onOpen.bind(this)}>{this.props.children}</a>
            <Modal ref={modalId} id={modalId} overlay={true} overlayClose={false}>
                <a onClick={this.onClose.bind(this)} className="close-button">&times;</a>
                <h3>Private Key View</h3>
                <div className="grid-block vertical">
                    <div className="content-block">
                    
                        <div className="grid-content">
                            <label>Public Key</label>
                            {this.props.pubkey}
                        </div>
                        <br/>
                        
                        <div className="grid-block grid-content">
                            <label>Private Key (WIF - Wallet Import Format)</label>
                            <div>
                                {this.state.wif ? <span>
                                    {this.state.wif}
                                    &nbsp;(<a onClick={this.onHide.bind(this)}>hide</a>)
                                </span>:<span>
                                    (<a onClick={this.onShow.bind(this)}>show</a>)
                                </span>}
                            </div>
                        </div>
                        <br/>

                        <div className="grid-block grid-content">
                            <label>Brainkey Position</label>
                            {key.brainkey_sequence == null ? "Non-deterministic" : key.brainkey_sequence}
                        </div>
                        <br/>

                        {key.import_account_names && key.import_account_names.length ?
                        <div className="grid-block grid-content">
                            <label>Imported From Account</label>
                            {key.import_account_names.join(", ")}
                            <br/>
                        </div>
                        :null}

                    </div>
                </div>
                <div className="button-group">
                    <a onClick={this.onClose.bind(this)} className="secondary button">close</a>
                </div>
            </Modal>
        </span>
    }
    
    onOpen() {
        var modalId = "key_view_modal" + this.props.pubkey
        ZfApi.publish(modalId, "open")
    }
    
    onClose() {
        this.reset()
        var modalId = "key_view_modal" + this.props.pubkey
        ZfApi.publish(modalId, "close")
    }
    
    onShow() {
        WalletUnlockActions.unlock().then( () => {
            var private_key = WalletDb.getPrivateKey(this.props.pubkey)
            this.setState({ wif: private_key.toWif() })
        })
    }
    
    onHide() {
        this.setState({ wif: null })
    }
    
}