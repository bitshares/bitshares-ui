import React from "react";
import {Link} from "react-router/es";
import { connect } from "alt-react";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import WalletDb from "stores/WalletDb";
import WalletUnlockStore from "stores/WalletUnlockStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletManagerStore from "stores/WalletManagerStore";
import cnames from "classnames";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import ReactTooltip from "react-tooltip";
import { Apis } from "bitsharesjs-ws";
import notify from "actions/NotificationActions";
import AccountImage from "../Account/AccountImage";
import { ChainStore } from "bitsharesjs";

class Header extends React.Component {

    static contextTypes = {
        location: React.PropTypes.object.isRequired,
        router: React.PropTypes.object.isRequired
    };

    constructor(props, context) {
        super();
        this.state = {
            active: context.location.pathname
        };

        this.unlisten = null;
        this._closeDropdown = this._closeDropdown.bind(this);
        this.onBodyClick = this.onBodyClick.bind(this);
    }

    componentWillMount() {
        this.unlisten = this.context.router.listen((newState, err) => {
            if (!err) {
                if (this.unlisten && this.state.active !== newState.pathname) {
                    this.setState({
                        active: newState.pathname
                    });
                }
            }
        });
    }

    componentDidMount() {
        setTimeout(() => {
            ReactTooltip.rebuild();
        }, 1250);

        document.body.addEventListener("click", this.onBodyClick, {capture: false, passive: true});
    }

    componentWillUnmount() {
        if (this.unlisten) {
            this.unlisten();
            this.unlisten = null;
        }

        document.body.removeEventListener("click", this.onBodyClick);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.currentAccount !== this.props.currentAccount ||
            nextProps.passwordLogin !== this.props.passwordLogin ||
            nextProps.locked !== this.props.locked ||
            nextProps.current_wallet !== this.props.current_wallet ||
            nextProps.lastMarket !== this.props.lastMarket ||
            nextProps.starredAccounts !== this.props.starredAccounts ||
            nextProps.currentLocale !== this.props.currentLocale ||
            nextState.active !== this.state.active ||
            nextState.dropdownActive !== this.state.dropdownActive ||
            nextProps.height !== this.props.height
        );
    }

    _showSend(e) {
        e.preventDefault();
        this.refs.send_modal.show();
        this._closeDropdown();
    }

    _toggleLock(e) {
        e.preventDefault();
        if (WalletDb.isLocked()) {
            WalletUnlockActions.unlock().then(() => {
                AccountActions.tryToSetCurrentAccount();
            });
        } else {
            WalletUnlockActions.lock();
        }
        this._closeDropdown();
    }

    _onNavigate(route, e) {
        e.preventDefault();

        // Set Accounts Tab as active tab
        if(route == "/accounts") {
            SettingsActions.changeViewSetting({
                dashboardEntry: "accounts"
            });
        }

        this.context.router.push(route);
        this._closeDropdown();
    }

    _closeDropdown() {
        this.setState({dropdownActive: false});
    }

    _onGoBack(e) {
        e.preventDefault();
        window.history.back();
    }

    _onGoForward(e) {
        e.preventDefault();
        window.history.forward();
    }

    _accountClickHandler(account_name, e) {
        e.preventDefault();
        ZfApi.publish("account_drop_down", "close");
        if (this.context.location.pathname.indexOf("/account/") !== -1) {
            let currentPath = this.context.location.pathname.split("/");
            currentPath[2] = account_name;
            this.context.router.push(currentPath.join("/"));
        }
        if (account_name !== this.props.currentAccount) {
            AccountActions.setCurrentAccount.defer(account_name);
            notify.addNotification({
                message: counterpart.translate("header.account_notify", {account: account_name}),
                level: "success",
                autoDismiss: 2,
                position: "br"
            });
            this._closeDropdown();
        }
    }

    onBodyClick(e) {
        let el = e.target;
        let insideDropdown = false;

        do {
            if(el.classList && el.classList.contains("dropdown-wrapper")) {
                insideDropdown = true;
                break;
            }

        } while ((el = el.parentNode));

        if(!insideDropdown) this._closeDropdown();
    }

    _onLinkAccount() {
        AccountActions.linkAccount(this.props.currentAccount);
    }

    _onUnLinkAccount() {
        AccountActions.unlinkAccount(this.props.currentAccount);
    }

    render() {
        let {active} = this.state;
        let {currentAccount, starredAccounts, passwordLogin, height} = this.props;
        let tradingAccounts = AccountStore.getMyAccounts();
        let maxHeight = Math.max(40, height - 67 - 36) + "px";

        const a = ChainStore.getAccount(currentAccount);
        const isMyAccount = !a ? false : AccountStore.isMyAccount(a);
        const isContact = this.props.linkedAccounts.has(currentAccount);
        const enableDepositWithdraw = Apis.instance().chain_id.substr(0, 8) === "4018d784" && isMyAccount;

        if (starredAccounts.size) {
            for (let i = tradingAccounts.length - 1; i >= 0; i--) {
                if (!starredAccounts.has(tradingAccounts[i])) {
                    tradingAccounts.splice(i, 1);
                }
            };
            starredAccounts.forEach(account => {
                if (tradingAccounts.indexOf(account.name) === -1) {
                    tradingAccounts.push(account.name);
                }
            });
        }

        let myAccounts = AccountStore.getMyAccounts();
        let myAccountCount = myAccounts.length;

        let walletBalance = myAccounts.length && this.props.currentAccount ? (
            <div className="total-value" >
                <TotalBalanceValue.AccountWrapper
                    accounts={[this.props.currentAccount]}
                    noTip
                />
            </div>) : null;

        let createAccountLink = myAccountCount === 0 ? (
            <ActionSheet.Button title="" setActiveState={() => {}}>
                <a className="button create-account" onClick={this._onNavigate.bind(this, "/create-account")}>
                    <Icon name="user"/> <Translate content="header.create_account" />
                </a>
            </ActionSheet.Button>
        ) : null;

        // Account selector: Only active inside the exchange
        let account_display_name, accountsList;
        if (currentAccount) {
            account_display_name = currentAccount.length > 20 ? `${currentAccount.slice(0, 20)}..` : currentAccount;
            if (tradingAccounts.indexOf(currentAccount) < 0 && isMyAccount) {
                tradingAccounts.push(currentAccount);
            }
            if (tradingAccounts.length >= 1) {
                accountsList = tradingAccounts
                .sort()
                .map((name) => {
                    return (
                        <li onClick={this._accountClickHandler.bind(this, name)} className={"account-item " + cnames({active: active.indexOf(name) !== -1})} key={name}>
                            <a>
                                <AccountImage size={{height: 1.6, width: 1.6}} unit="rem" account={name}/>
                                <span className={"lower-case" + (name === account_display_name ? " current-account" : "")}>{name}</span>
                            </a>
                        </li>
                    );
                });
            }
        }

        let caret = !this.state.dropdownActive ? <span>&#9660;</span> : <span>&#9650;</span>;

        return (
            <div className="header menu-group primary">
                {!__ELECTRON__ ? <div className="grid-block show-for-medium shrink electron-navigation">
                    <ul className="menu-bar">
                        <li>
                            <div onClick={this._onGoBack.bind(this)}>{"<"}</div>
                        </li>
                        <li>
                            <div onClick={this._onGoForward.bind(this)}>></div>
                        </li>
                    </ul>
                </div> : null}
                <div className="grid-block"></div>
                <div className="grid-block shrink">
                    <div className="header-right-menu">
                        <div className="overflow-visible account-drop-down">
                            {createAccountLink ? createAccountLink : <div className={cnames("dropdown-wrapper", {active: this.state.dropdownActive})}>
                                <li className="account-header-link">
                                    <div className="lock-unlock-wrapper grid-block shrink" onClick={this._toggleLock.bind(this)}>
                                        <Icon className="lock-unlock" size="2x" name={this.props.locked ? "locked" : "unlocked"} />
                                    </div>
                                    <div onClick={() => {this.setState({dropdownActive: !this.state.dropdownActive});}} className="grid-block account-name-wrapper">
                                        <div>
                                          {currentAccount}
                                          {walletBalance}
                                        </div>
                                        <span className="caret">{caret}</span>
                                    </div>
                                </li>
                                <ul className="dropdown header-menu block-list" style={{maxHeight: !this.state.dropdownActive ? 0 : maxHeight}}>
                                    <li><a onClick={this._toggleLock.bind(this)}>
                                        <Icon name="power" />
                                        <Translate content={`header.${this.props.locked ? "unlock_short" : "lock_short"}`} />
                                    </a></li>
                                    {!isMyAccount ? <li><a onClick={this[isContact ? "_onUnLinkAccount" : "_onLinkAccount"].bind(this)}>
                                        <Icon name={`${isContact ? "minus" : "plus"}-circle`} />
                                        <Translate content={`account.${isContact ? "unfollow" : "follow"}`} />
                                    </a></li> : null}
                                    <li className={cnames({active: active.indexOf("/settings") !== -1})}><a onClick={this._onNavigate.bind(this, "/settings")}>
                                        <Icon name="cogs" />
                                        <Translate content="header.settings" />
                                    </a></li>
                                    <li className={cnames({active: active.indexOf("/help") !== -1})}><a onClick={this._onNavigate.bind(this, "/help")}>
                                        <Icon name="question-circle" />
                                        <Translate content="header.help" />
                                    </a></li>
                                    <li className={cnames({active: active.indexOf("/accounts") !== -1})}><a onClick={this._onNavigate.bind(this, "/accounts")}>
                                       <Icon name="folder" />
                                       <Translate content="explorer.accounts.title" />
                                    </a></li>
                                    {accountsList}
                                </ul>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>

        );

    }
}

export default connect(Header, {
    listenTo() {
        return [AccountStore, WalletUnlockStore, WalletManagerStore, SettingsStore];
    },
    getProps() {
        const chainID = Apis.instance().chain_id;
        return {
            linkedAccounts: AccountStore.getState().linkedAccounts,
            currentAccount: AccountStore.getState().currentAccount || AccountStore.getState().passwordAccount,
            locked: WalletUnlockStore.getState().locked,
            current_wallet: WalletManagerStore.getState().current_wallet,
            lastMarket: SettingsStore.getState().viewSettings.get(`lastMarket${chainID ? ("_" + chainID.substr(0, 8)) : ""}`),
            starredAccounts: AccountStore.getState().starredAccounts,
            passwordLogin: SettingsStore.getState().settings.get("passwordLogin"),
            currentLocale: SettingsStore.getState().settings.get("locale"),
            locales: SettingsStore.getState().defaults.locale
        };
    }
});
