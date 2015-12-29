import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import Icon from "../Icon/Icon";
import AccountInfo from "./AccountInfo";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import ConfirmModal from "../Modal/ConfirmModal";
import notify from "actions/NotificationActions";
import LoadingIndicator from "../LoadingIndicator";
import Immutable from "immutable";
import WalletDb from "stores/WalletDb";

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
    }

    shouldComponentUpdate(nextProps) {
        const changed = this.last_path !== window.location.hash;
        this.last_path = window.location.hash;
        return changed || this.props.account !== nextProps.account || this.props.linkedAccounts !== nextProps.linkedAccounts
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

    render() {
        let {account, linkedAccounts, isMyAccount} = this.props;
        let account_name = account.get("name");
        let linkBtn = null;
        if (!isMyAccount) {
            linkBtn = linkedAccounts.has(account_name) ?
                <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onUnlinkAccount.bind(this)}><Translate
                    content="account.unfollow"/></a> :
                <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onLinkAccount.bind(this)}><Translate
                    content="account.follow"/></a>;
        }
        let settings       = counterpart.translate("header.settings");
        return (
            <div className="grid-block vertical account-left-panel no-padding no-overflow">
                <div className="grid-block">
                    <div className="grid-content no-padding">
                        <ConfirmModal
                            modalId="confirm_modal"
                            ref="confirmModal" />

                        <div className="regular-padding">
                            <AccountInfo account={account.get("id")} image_size={{height: 120, width: 120}} my_account={isMyAccount}/>
                            <div className="grid-container no-margin">
                                { linkBtn }
                                <Link className="button outline block-button" to={`/transfer/?to=${account_name}`}><Translate content="account.pay"/></Link>
                            </div>
                        </div>
                        <section className="block-list">
                            <ul className="account-left-menu">
                                <li><Link to={`/account/${account_name}/overview/`} activeClassName="active"><Translate content="account.overview"/></Link></li>
                                <li><Link to={`/account/${account_name}/assets/`} activeClassName="active"><Translate content="explorer.assets.title"/></Link></li>
                                <li><Link to={`/account/${account_name}/member-stats/`} activeClassName="active"><Translate content="account.member.stats"/></Link></li>
                                <li><Link to={`/account/${account_name}/permissions/`} activeClassName="active"><Translate content="account.permissions"/></Link></li>
                                <li><Link to={`/account/${account_name}/voting/`} activeClassName="active"><Translate content="account.voting"/></Link></li>
                                <li><Link to={`/account/${account_name}/orders/`} activeClassName="active"><Translate content="account.orders"/></Link></li>
                                <li><Link to={`/account/${account_name}/whitelist/`} activeClassName="active"><Translate content="account.whitelist.title"/></Link></li>
                                {isMyAccount ? <li><Link to={`/account/${account_name}/deposit-withdraw/`} activeClassName="active"><Translate content="account.deposit_withdraw"/></Link></li> : null}
                            </ul>
                        </section>
                    </div>
                </div>
                {isMyAccount ?
                <div className="grid-block shrink bottom">
                    <div className="center">
                        <a href data-tip="Create New Account" data-place="top" onClick={this.onCreateAccountClick.bind(this)}><Icon name="plus-circle"/></a>
                    </div>
                </div> : null}
            </div>
        );
    }
}

export default AccountLeftPanel;
