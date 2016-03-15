import React from "react";
import ReactDOM from "react-dom";
import Immutable from "immutable";
import AccountsList from "./AccountsList";
import RecentTransactions from "../Account/RecentTransactions";
import Translate from "react-translate-component";
import Proposals from "components/Account/Proposals";
import ps from "perfect-scrollbar";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import CreatePrivateAccountModal from "../Stealth/CreatePrivateAccountModal";
import CreatePrivateContactModal from "../Stealth/CreatePrivateContactModal";
import AccountActions from "actions/AccountActions";
import Icon from "../Icon/Icon";
import WalletDb from "stores/WalletDb";
import ReceiveFundsModal from "../Stealth/ReceiveFundsModal";
import PubKey from "../Utility/PubKey";
import WalletUnlockStore from "stores/WalletUnlockStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import {Link} from "react-router";
import connectToStores from "alt/utils/connectToStores";

@connectToStores
class Dashboard extends React.Component {

    static contextTypes = {
        history: React.PropTypes.object
    };

    constructor() {
        super();
        this.state = {
            width: null,
            dashboardFilter: ""
        };
        this._setWidth = this._setWidth.bind(this);
        this._addPublicAccount = this._addPublicAccount.bind(this);
        this._addPrivateAccount = this._addPrivateAccount.bind(this);
        this._addPrivateContact = this._addPrivateContact.bind(this);
    }

    static getStores() {
        return [WalletUnlockStore]
    }

    static getPropsFromStores() {
        return {wallet_locked: WalletUnlockStore.getState().locked}
    }

    componentDidMount() {
        //let c = ReactDOM.findDOMNode(this.refs.container);
        //ps.initialize(c);
        //let t = ReactDOM.findDOMNode(this.refs.transactions);
        //ps.initialize(t);
        this._setWidth();
        window.addEventListener("resize", this._setWidth, false);
    }

    componentDidUpdate() {
        //let c = ReactDOM.findDOMNode(this.refs.container);
        //ps.update(c);
        //let t = ReactDOM.findDOMNode(this.refs.transactions);
        //ps.update(t);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setWidth, false);
    }

    _setWidth() {
        let width = window.innerWidth;
        if (width !== this.state.width) {
            this.setState({width});
        }
    }

    _onFilter(e) {
        this.setState({dashboardFilter: e.target.value});
    }

    _addPublicAccount(e) {
        e.preventDefault();
        console.log("-- Dashboard._addPublicAccount -->");
        // ReactTooltip.hide();
        this.context.history.pushState(null, "/create-account");
    }

    _addPrivateAccount(e) {
        e.preventDefault();
        console.log("-- Dashboard._addPrivateAccount -->");
        this.refs.CreatePrivateAccountModal.clear();
        ZfApi.publish("action-sheet-add", "close");
        ZfApi.publish("add_private_account_modal", "open");
    }

    _addPrivateContact(e) {
        e.preventDefault();
        console.log("-- Dashboard._addPrivateContact -->");
        this.refs.CreatePrivateContactModal.clear();
        ZfApi.publish("action-sheet-add", "close");
        ZfApi.publish("add_private_contact_modal", "open");
    }

    _removePrivateContact(name) {
        console.log("-- Dashboard._removePrivateContact -->", name);
        ReactTooltip.hide();
        AccountActions.removePrivateContact(name);
    }

    _selectElementText(el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    _copyToClipboard(name, e) {
        console.log("-- Dashboard._copyToClipboard -->", name);
        e.preventDefault();
        const el =  this.refs["$name$" + name];
        this._selectElementText(el);
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
    }

    _onReceiveClick(e) {
        e.preventDefault();
        ZfApi.publish("receive_funds_modal", "open");
    }

    _onAddButtonClicked(e) {
        e.preventDefault();
        WalletUnlockActions.unlock().then(() => {
            ZfApi.publish("action-sheet-add", "toggle");
        });
    }

    render() {
        let {width} = this.state;
        let public_accounts = this.props.linkedAccounts.toList();
        let private_accounts = this.props.privateAccounts.toList();
        let private_contacts = this.props.privateContacts.toList();

        let outerClass = "grid-block page-layout no-overflow " + (width < 750 ? "vertical" : "horizontal");
        let firstDiv = "grid-content no-overflow " + (width < 750 ? "" : "shrink");

        const df = this.state.dashboardFilter;
        const filterText = counterpart.translate("markets.filter");

        return (
            <div className={outerClass}>

                <div className={firstDiv} style={{minWidth: "50%"}}>
                    <div className="content-block">
                        <br/>
                        <input placeholder={filterText} type="text" value={df} onChange={this._onFilter.bind(this)} />
                    </div>

                    <div ref="container" className="content-block">
                        <div className="float-right">
                            <ActionSheet id="action-sheet-add">
                                <a href className="button outline" onClick={this._onAddButtonClicked}>+</a>
                                <ActionSheet.Content>
                                    <ul>
                                        <li><a href="#" onClick={this._addPublicAccount}>Add Public Account</a></li>
                                        <li><a href="#" onClick={this._addPrivateAccount}>Add Private Account</a></li>
                                        <li><a href="#" onClick={this._addPrivateContact}>Add Private Contact</a></li>
                                    </ul>
                                </ActionSheet.Content>
                            </ActionSheet>
                        </div>
                        <AccountsList title="Public Accounts" accounts={public_accounts} width={width} dashboardFilter={df} myAccountsOnly/>
                    </div>
                    {!private_accounts.isEmpty() && <div ref="container" className="content-block">
                        <button className="button outline float-right" onClick={this._onReceiveClick} data-tip="Add Private Account" data-type="light"><Translate content="account.receive"/></button>
                        <h4>Private Accounts</h4>
                        <table className="table table-hover">
                            <thead>
                            <tr>
                                <th><Translate content="header.account" /></th>
                                <th>Public Key</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                private_accounts.filter(name => name.indexOf(df) !== -1).map(name => {
                                    return (<tr key={name}>
                                        <td ref={"$name$" + name}>
                                            <Link to={`/transfer/?from=~${name}`}><span className="name-prefix">~</span>{name}</Link>
                                            <a href onClick={this._copyToClipboard.bind(this, name)} data-tip="Copy to Clipboard" data-type="light"><Icon name="clipboard-copy"/></a></td>
                                        <td><PubKey getValue={() =>  WalletDb.getState().cwallet.getPublicKey(name)}/></td>
                                    </tr>);
                                })
                            }
                            </tbody>
                        </table>
                    </div>}
                    {!private_contacts.isEmpty() && <div ref="container" className="content-block">
                        <h4>Private Contacts</h4>
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th><Translate content="header.account" /></th>
                                    <th>PUBLIC KEY</th>
                                    <th width="48px">REMOVE</th>
                                </tr>
                            </thead>
                            <tbody>
                            {
                                private_contacts.filter(name => name.indexOf(df) !== -1).map(name => {
                                    return (<tr key={name}>
                                        <td ref={"$name$" + name}>
                                            <Link to={`/transfer/?to=~${name}`}><span className="name-prefix">~</span>{name}</Link>
                                            <a href onClick={this._copyToClipboard.bind(this, name)} data-tip="Copy to Clipboard" data-type="light"><Icon name="clipboard-copy"/></a></td>
                                        <td><PubKey getValue={() =>  WalletDb.getState().cwallet.getPublicKey(name)}/></td>
                                        <td><button className="button outline" onClick={this._removePrivateContact.bind(this, name)} data-tip="Remove Contact" data-type="light">-</button></td>
                                    </tr>);
                                })
                            }
                            </tbody>
                        </table>
                    </div>}
                    <div ref="container" className="content-block">
                        <AccountsList title="Following" accounts={public_accounts} width={width} dashboardFilter={this.state.dashboardFilter} notMyAccountsOnly/>
                    </div>
                </div>

                <div className="grid-block right-column no-overflow">
                    <div ref="transactions" className="grid-content" style={{paddingLeft: "0.5rem", paddingRight: "0.25rem"}}>
                        {this.props.wallet_locked ?
                            <div>
                                {private_contacts.isEmpty() && <p className="float-right" style={{fontSize: '0.9rem'}}>Unlock to see private transactions &nbsp;</p>}
                                <RecentTransactions accountsList={this.props.linkedAccounts} limit={25} compactView={true}/>
                            </div>
                            :  <RecentTransactions accountsList={this.props.linkedAccounts} blindHistory={WalletDb.getState().cwallet.blindHistory().toJS()} limit={25} compactView={true}/>}
                    </div>
                </div>

                <CreatePrivateAccountModal ref="CreatePrivateAccountModal"/>
                <CreatePrivateContactModal ref="CreatePrivateContactModal"/>
                <ReceiveFundsModal />
            </div>);
    }
}

export default Dashboard;
