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
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import CreatePrivateAccountModal from "../Account/CreatePrivateAccountModal";
import CreatePrivateContactModal from "../Account/CreatePrivateContactModal";
import AccountActions from "actions/AccountActions";
import Icon from "../Icon/Icon";

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


    componentDidMount() {
        let c = ReactDOM.findDOMNode(this.refs.container);
        ps.initialize(c);
        let t = ReactDOM.findDOMNode(this.refs.transactions);
        ps.initialize(t);
    }

    componentDidUpdate() {
        let c = ReactDOM.findDOMNode(this.refs.container);
        ps.update(c);
        let t = ReactDOM.findDOMNode(this.refs.transactions);
        ps.update(t);        
    }

    componentDidMount() {
        this._setWidth();

        window.addEventListener("resize", this._setWidth, false);
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

    _addPublicAccount() {
        console.log("-- Dashboard._addPublicAccount -->");
        ReactTooltip.hide();
        this.context.history.pushState(null, "/create-account");
    }

    _addPrivateAccount() {
        console.log("-- Dashboard._addPrivateAccount -->");
        this.refs.CreatePrivateAccountModal.clear();
        ZfApi.publish("add_private_account_modal", "open");
    }

    _addPrivateContact() {
        console.log("-- Dashboard._addPrivateContact -->");
        this.refs.CreatePrivateContactModal.clear();
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
        e.preventDefault();
        const el =  this.refs["$name$" + name];
        this._selectElementText(el);
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
    }

    render() {
        let {width} = this.state;
        let public_accounts = this.props.linkedAccounts.toList();
        let private_accounts = this.props.privateAccounts.toList();
        let private_contacts = this.props.privateContacts.toList();
        console.log("-- Dashboard.render -->", private_accounts.toJS());

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
                        <button className="button outline float-right" onClick={this._addPublicAccount} data-tip="Add Public Account" data-type="light">+</button>
                        <h4>Public Accounts</h4>
                        <AccountsList accounts={public_accounts} width={width} dashboardFilter={df} myAccountsOnly/>
                    </div>
                    <div ref="container" className="content-block">
                        <button className="button outline float-right" onClick={this._addPrivateAccount} data-tip="Add Private Account" data-type="light">+</button>
                        <h4>Private Accounts</h4>
                        <table className="table table-hover">
                            <thead>
                            <tr>
                                <th><Translate content="header.account" /></th>
                                <th width="48px">COPY</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                private_accounts.filter(name => name.indexOf(df) !== -1).map(name => {
                                    return (<tr key={name}>
                                        <td ref={"$name$" + name}><span className="name-prefix">~</span>{name}</td>
                                        <td><a href onClick={this._copyToClipboard.bind(this, name)} data-tip="Copy to Clipboard" data-type="light"><Icon name="clipboard-copy"/></a></td>
                                    </tr>);
                                })
                            }
                            </tbody>
                        </table>
                    </div>
                    <div ref="container" className="content-block">
                        <button className="button outline float-right" onClick={this._addPrivateContact} data-tip="Add Private Contact" data-type="light">+</button>
                        <h4>Private Contacts</h4>
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th><Translate content="header.account" /></th>
                                    <th width="48px">COPY</th>
                                    <th width="48px">REMOVE</th>
                                </tr>
                            </thead>
                            <tbody>
                            {
                                private_contacts.filter(name => name.indexOf(df) !== -1).map(name => {
                                    return (<tr key={name}>
                                        <td ref={"$name$" + name}><span className="name-prefix">~</span>{name}</td>
                                        <td><a href onClick={this._copyToClipboard.bind(this, name)} data-tip="Copy to Clipboard" data-type="light"><Icon name="clipboard-copy"/></a></td>
                                        <td><button className="button outline" onClick={this._removePrivateContact.bind(this, name)} data-tip="Remove Contact" data-type="light">-</button></td>
                                    </tr>);
                                })
                            }
                            </tbody>
                        </table>
                    </div>
                    <div ref="container" className="content-block">
                        <h4>Following</h4>
                        <AccountsList accounts={public_accounts} width={width} dashboardFilter={this.state.dashboardFilter} notMyAccountsOnly/>
                    </div>
                </div>

                <div className="grid-block right-column no-overflow">
                    <div ref="transactions" className="grid-content" style={{paddingLeft: "0.5rem", paddingRight: "0.25rem"}}>
                        <RecentTransactions accountsList={this.props.linkedAccounts} limit={25} compactView={true}/>
                    </div>
                </div>

                <CreatePrivateAccountModal ref="CreatePrivateAccountModal"/>
                <CreatePrivateContactModal ref="CreatePrivateContactModal"/>

            </div>);
    }
}

export default Dashboard;
