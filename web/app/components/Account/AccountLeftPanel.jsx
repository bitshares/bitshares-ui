import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import Icon from "../Icon/Icon";
import AccountInfo from "./AccountInfo";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import SettingsActions from "actions/SettingsActions";

class AccountLeftPanel extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired,
        linkedAccounts: PropTypes.object,
    };

    static contextTypes = {
        history: React.PropTypes.object
    }

    constructor(props) {
        super(props);
        this.last_path = null;

        this.state = {
            showAdvanced: props.viewSettings.get("showAdvanced", false)
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const changed = this.last_path !== window.location.hash;
        this.last_path = window.location.hash;
        return (
            changed ||
            this.props.account !== nextProps.account ||
            this.props.linkedAccounts !== nextProps.linkedAccounts ||
            nextState.showAdvanced !== this.state.showAdvanced
        );
    }

    onLinkAccount(e) {
        e.preventDefault();
        AccountActions.linkAccount(this.props.account.get("name"));
    }

    onUnlinkAccount(e) {
        e.preventDefault();
        AccountActions.unlinkAccount(this.props.account.get("name"));
    }

    onCreateAccountClick(e) {
        e.preventDefault();
        ReactTooltip.hide();
        this.context.history.pushState(null, "/create-account");
    }

    _toggleAdvanced() {
        let newState = !this.state.showAdvanced;
        this.setState({
            showAdvanced: newState
        });

        SettingsActions.changeViewSetting({showAdvanced: newState});
    }

    render() {
        let {account, linkedAccounts, isMyAccount} = this.props;
        let account_name = account.get("name");
        let linkBtn = null;

        linkBtn = isMyAccount ? null : linkedAccounts.has(account_name) ?
            <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onUnlinkAccount.bind(this)}><Translate
                content="account.unfollow"/></a> :
            <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onLinkAccount.bind(this)}><Translate
                content="account.follow"/></a>;

        let settings = counterpart.translate("header.settings");

        let caret = this.state.showAdvanced ? <span>&#9660;</span> : <span>&#9650;</span>;

        return (
            <div className="grid-block vertical account-left-panel no-padding no-overflow">
                <div className="grid-block">
                    <div className="grid-content no-padding" style={{overflowX: "hidden"}}>

                        <div className="regular-padding">
                            <AccountInfo account={account.get("id")} image_size={{height: 90, width: 90}} my_account={isMyAccount}/>
                            <div className="grid-container no-margin">
                                { linkBtn }
                                <Link className="button outline block-button" to={`/transfer/?to=${account_name}`}><Translate content="account.pay"/></Link>
                            </div>
                        </div>
                        <section className="block-list">
                            <ul className="account-left-menu" style={{marginBottom: 0}}>
                                <li><Link to={`/account/${account_name}/overview/`} activeClassName="active"><Translate content="account.overview"/></Link></li>
                                <li><Link to={`/account/${account_name}/member-stats/`} activeClassName="active"><Translate content="account.member.stats"/></Link></li>
                                <li><Link to={`/account/${account_name}/orders/`} activeClassName="active"><Translate content="account.open_orders"/></Link></li>
                                <li><Link to={`/account/${account_name}/voting/`} activeClassName="active"><Translate content="account.voting"/></Link></li>
                                {isMyAccount ? <li><Link to={`/account/${account_name}/deposit-withdraw/`} activeClassName="active"><Translate content="account.deposit_withdraw"/></Link></li> : null}

                                {/* Advanced features*/}
                                <li className="menu-subheader" onClick={this._toggleAdvanced.bind(this)}>
                                    <span className="button outline">
                                        <Translate content="account.user_issued_assets.advanced" />
                                        <span>  {caret}</span>
                                    </span>
                                </li>
                            </ul>
                            {this.state.showAdvanced ? (<ul className="account-left-menu">
                                <li><Link to={`/account/${account_name}/assets/`} activeClassName="active"><Translate content="explorer.assets.title"/></Link></li>
                                <li><Link to={`/account/${account_name}/permissions/`} activeClassName="active"><Translate content="account.permissions"/></Link></li>
                                <li><Link to={`/account/${account_name}/whitelist/`} activeClassName="active"><Translate content="account.whitelist.title"/></Link></li>
                                {isMyAccount ? <li><Link to={`/account/${account_name}/vesting/`} activeClassName="active"><Translate content="account.vesting.title"/></Link></li> : null}
                            </ul>) : null}
                        </section>
                    </div>
                </div>
                {isMyAccount ?
                <div className="grid-block shrink bottom">
                    <div className="center">
                        <a href data-tip={counterpart.translate("account.create_new")} data-place="top" onClick={this.onCreateAccountClick.bind(this)}><Icon name="plus-circle"/></a>
                    </div>
                </div> : null}
            </div>
        );
    }
}

export default AccountLeftPanel;
