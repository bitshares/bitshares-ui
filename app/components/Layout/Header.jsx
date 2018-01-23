import React from "react";
import {Link} from "react-router/es";
import { connect } from "alt-react";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import SendModal from "../Modal/SendModal";
import DepositModal from "../Modal/DepositModal";
import GatewayStore from "stores/GatewayStore";
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
// import IntlActions from "actions/IntlActions";
import AccountImage from "../Account/AccountImage";
import {ChainStore} from "bitsharesjs";

var logo = require("assets/logo-ico-blue.png");

// const FlagImage = ({flag, width = 20, height = 20}) => {
//     return <img height={height} width={width} src={`${__BASE_URL__}language-dropdown/${flag.toUpperCase()}.png`} />;
// };

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

    _showDeposit(e) {
        e.preventDefault();
        this.refs.deposit_modal_new.show();
        this._closeDropdown();
    }


    _triggerMenu(e) {
        e.preventDefault();
        ZfApi.publish("mobile-menu", "toggle");
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
        // this.onClickUser(account_name, e);
    }

    // onClickUser(account, e) {
    //     e.stopPropagation();
    //     e.preventDefault();
    //
    //     this.context.router.push(`/account/${account}/overview`);
    // }

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
                                    style={{minHeight: 15}}
                                />
                            </div>) : null;

        let dashboard = (
            <a
                style={{padding: "12px 1.75rem"}}
                className={cnames({active: active === "/" || (active.indexOf("dashboard") !== -1 && active.indexOf("account") === -1)})}
                onClick={this._onNavigate.bind(this, "/dashboard")}
            >
                <img style={{margin: 0, height: 40}} src={logo} />
            </a>
        );

        let createAccountLink = myAccountCount === 0 ? (
            <ActionSheet.Button title="" setActiveState={() => {}}>
                <a className="button create-account" onClick={this._onNavigate.bind(this, "/create-account")} style={{padding: "1rem", border: "none"}} >
                    <Icon className="icon-14px" name="user"/> <Translate content="header.create_account" />
                </a>
            </ActionSheet.Button>
        ) : null;

        // let lock_unlock = ((!!this.props.current_wallet) || passwordLogin) ? (
        //     <div className="grp-menu-item" >
        //     { this.props.locked ?
        //         <a style={{padding: "1rem"}} href onClick={this._toggleLock.bind(this)} data-class="unlock-tooltip" data-offset="{'left': 50}" data-tip={locked_tip} data-place="bottom" data-html><Icon className="icon-14px" name="locked"/></a>
        //         : <a style={{padding: "1rem"}} href onClick={this._toggleLock.bind(this)} data-class="unlock-tooltip" data-offset="{'left': 50}" data-tip={unlocked_tip} data-place="bottom" data-html><Icon className="icon-14px" name="unlocked"/></a> }
        //     </div>
        // ) : null;

        let tradeUrl = this.props.lastMarket ? `/market/${this.props.lastMarket}` : "/market/USD_BTS";
        let tradeLink = <a style={{flexFlow: "row"}} className={cnames({active: active.indexOf("market/") !== -1})} onClick={this._onNavigate.bind(this, tradeUrl)}>
                <Icon size="1_5x" style={{position: "relative", top: -2, left: -8}} name="trade"/>
                <Translate component="span" content="header.exchange" />
            </a>;

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
                        <li className={cnames({active: active.replace("/account/", "").indexOf(name) === 0})} onClick={this._accountClickHandler.bind(this, name)} key={name}>
                            <div style={{paddingTop: 0}} className="table-cell"><AccountImage style={{position: "relative", top: 4}} size={{height: 20, width: 20}} account={name}/></div>
                            <div className="table-cell" style={{paddingLeft: 10}}><a className={"lower-case" + (name === account_display_name ? " current-account" : "")}>{name}</a></div>
                        </li>
                    );
                });
            }
        }

        let hamburger = this.state.dropdownActive ? <Icon className="icon-14px" name="hamburger-x" /> : <Icon className="icon-14px" name="hamburger" />;

        return (
            <div className="header menu-group primary">
                {/*<div className="show-for-small-only">
                    <ul className="primary menu-bar title">
                        <li><a href onClick={this._triggerMenu}><Icon className="icon-32px" name="menu"/></a></li>
                    </ul>
                </div>*/}
                {__ELECTRON__ ? <div className="grid-block show-for-medium shrink electron-navigation">
                    <ul className="menu-bar">
                        <li>
                            <div style={{marginLeft: "1rem", height: "3rem"}}>
                                <div style={{marginTop: "0.5rem"}} onClick={this._onGoBack.bind(this)} className="button outline small">{"<"}</div>
                            </div>
                    </li>
                        <li>
                            <div style={{height: "3rem", marginLeft: "0.5rem", marginRight: "0.75rem"}}>
                                <div style={{marginTop: "0.5rem"}} onClick={this._onGoForward.bind(this)} className="button outline small">></div>
                            </div>
                        </li>
                    </ul>
                </div> : null}
                <div className="grid-block">
                    <ul className="menu-bar">
                        <li>{dashboard}</li>
                        {!currentAccount || !!createAccountLink ? null :
                        <li>
                            <Link style={{flexFlow: "row"}} to={`/account/${currentAccount}`} className={cnames({active: active.indexOf("account/") !== -1 && active.indexOf("/account/") !== -1})}>
                                <Icon size="1_5x" style={{position: "relative", top: -2, left: -8}} name="dashboard"/>
                                <Translate className="column-hide-small" content="header.dashboard" />
                            </Link>
                        </li>}
                        <li className="column-hide-small">{tradeLink}</li>
                        {/* {currentAccount || myAccounts.length ? <li><a className={cnames({active: active.indexOf("transfer") !== -1})} onClick={this._onNavigate.bind(this, "/transfer")}><Translate component="span" content="header.payments" /></a></li> : null} */}
                        <li className="column-hide-small">
                            <a style={{flexFlow: "row"}} className={cnames({active: active.indexOf("explorer") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/blocks")}>
                                <Icon size="2x" style={{position: "relative", top: 0, left: -8}} name="server"/>
                                <Translate component="span" content="header.explorer" />
                            </a>
                        </li>
                        {!!createAccountLink ? null : <li className="column-hide-small">
                            <a style={{flexFlow: "row"}} onClick={this._showSend.bind(this)}>
                                <Icon size="1_5x" style={{position: "relative", top: 0, left: -8}} name="transfer"/>
                                <span><Translate content="header.payments" /></span>
                            </a>
                        </li>}

                        {!!createAccountLink ? <li>
                            <a style={{flexFlow: "row"}} className={cnames({active: active.indexOf("settings") !== -1})} onClick={this._onNavigate.bind(this, "/settings")}>
                                <Icon size="2x" style={{position: "relative", top: 0, left: -8}} name="cogs"/>
                                <span className="column-hide-tiny"><Translate content="header.settings" /></span>
                            </a>
                        </li> : null}
                        {/* {enableDepositWithdraw && currentAccount && myAccounts.indexOf(currentAccount) !== -1 ? <li><Link to={"/deposit-withdraw/"} activeClassName="active"><Translate content="account.deposit_withdraw"/></Link></li> : null} */}
                    </ul>
                </div>
                <div className="grid-block shrink">
                    <div className="grp-menu-items-group header-right-menu">

                        <div className="grp-menu-item overflow-visible account-drop-down">
                                {createAccountLink ? createAccountLink : [
                                <div key="padlock" style={{paddingBottom: 15}} className="header-right-lock show-for-medium" onClick={this._toggleLock.bind(this)}>
                                    <Icon className="lock-unlock" style={{margin: "0 0.5rem"}} size="2x" name={this.props.locked ? "locked" : "unlocked"} />
                                </div>,
                                <div key="dropdown" className={cnames("dropdown-wrapper", {active: this.state.dropdownActive})}>
                                    <li style={{display: "flex"}}>
                                        <div onClick={() => {this.setState({dropdownActive: !this.state.dropdownActive});}} className="table-cell" style={{flex: 1}}>
                                            <div style={{lineHeight: "initial", display: "inline-block", paddingRight: 20}}>
                                                <span>{currentAccount}</span>
                                                {walletBalance}
                                                <div className="hamburger">{hamburger}</div>
                                            </div>

                                        </div>
                                    </li>
                                    <ul className="dropdown header-menu" style={{left: 0, top: 63, maxHeight: !this.state.dropdownActive ? 0 : maxHeight, overflowY: "auto"}}>
                                        <li className="divider" onClick={this._toggleLock.bind(this)}>
                                            <div className="table-cell"><Icon size="2x" name="power" /></div>
                                            <div className="table-cell"><Translate content={`header.${this.props.locked ? "unlock_short" : "lock_short"}`} /></div>
                                        </li>

                                        {!isMyAccount ? <li className="divider" onClick={this[isContact ? "_onUnLinkAccount" : "_onLinkAccount"].bind(this)}>
                                            <div className="table-cell"><Icon size="2x" name={`${isContact ? "minus" : "plus"}-circle`} /></div>
                                            <div className="table-cell"><Translate content={`account.${isContact ? "unfollow" : "follow"}`} /></div>
                                        </li> : null}

                                        <li className={cnames({active: active.indexOf("/market/") !== -1}, "column-show-small")} onClick={this._onNavigate.bind(this, tradeUrl)}>
                                            <div className="table-cell"><Icon size="2x" name="trade" /></div>
                                            <div className="table-cell"><Translate content="header.exchange" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/explorer") !== -1}, "column-show-small")} onClick={this._onNavigate.bind(this, "/explorer/blocks")}>
                                            <div className="table-cell"><Icon size="2x" name="server" /></div>
                                            <div className="table-cell"><Translate content="header.explorer" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/transfer") !== -1}, {disabled: !isMyAccount})} onClick={!isMyAccount ? () => {} : this._onNavigate.bind(this, "/transfer")}>
                                            <div className="table-cell"><Icon size="2x" name="transfer" /></div>
                                            <div className="table-cell"><Translate content="header.payments_legacy" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/deposit-withdraw") !== -1}, {disabled: !enableDepositWithdraw})} onClick={!enableDepositWithdraw ? () => {} : this._onNavigate.bind(this, "/deposit-withdraw")}>
                                            <div className="table-cell"><Icon size="2x" name="deposit" /></div>
                                            <div className="table-cell"><Translate content="gateway.deposit" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/deposit-withdraw") !== -1}, {disabled: !enableDepositWithdraw})} onClick={!enableDepositWithdraw ? () => {} : this._showDeposit.bind(this)}>
                                            <div className="table-cell"><Icon size="2x" name="deposit" /></div>
                                            <div className="table-cell"><Translate content="modal.deposit.submit_beta" /></div>
                                        </li>

                                        <li className={cnames("divider", {active: active.indexOf("/deposit-withdraw") !== -1}, {disabled: !enableDepositWithdraw})} onClick={!enableDepositWithdraw ? () => {} : this._onNavigate.bind(this, "/deposit-withdraw")}>
                                            <div className="table-cell"><Icon size="2x" name="withdraw" /></div>
                                            <div className="table-cell"><Translate content="modal.withdraw.submit" /></div>
                                        </li>


                                        <li className={cnames({active: active.indexOf("/settings") !== -1}, "divider")} onClick={this._onNavigate.bind(this, "/settings")}>
                                            <div className="table-cell"><Icon size="2x" name="cogs" /></div>
                                            <div className="table-cell"><Translate content="header.settings" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/news") !== -1})} onClick={this._onNavigate.bind(this, "/news")}>
                                            <div className="table-cell"><Icon size="2x" name="news" /></div>
                                            <div className="table-cell"><Translate content="news.news" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/help/introduction/bitshares") !== -1}, "divider")} onClick={this._onNavigate.bind(this, "/help/introduction/bitshares")}>
                                            <div className="table-cell"><Icon size="2x" name="question-circle" /></div>
                                            <div className="table-cell"><Translate content="header.help" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/voting") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/voting`)}>
                                            <div className="table-cell"><Icon size="2x" name="thumbs-up" /></div>
                                            <div className="table-cell"><Translate content="account.voting" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/assets") !== -1 && active.indexOf("/account/") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/assets`)}>
                                            <div className="table-cell"><Icon size="2x" name="assets" /></div>
                                            <div className="table-cell"><Translate content="explorer.assets.title" /></div>
                                        </li>
                                        <li className={cnames({active: active.indexOf("/signedmessages") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/signedmessages`)}>
                                            <div className="table-cell"><Icon size="2x" name="text" /></div>
                                            <div className="table-cell"><Translate content="account.signedmessages.menuitem" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/member-stats") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/member-stats`)}>
                                            <div className="table-cell"><Icon size="2x" name="text" /></div>
                                            <div className="table-cell"><Translate content="account.member.stats" /></div>
                                        </li>

                                        {isMyAccount ? <li className={cnames({active: active.indexOf("/vesting") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/vesting`)}>
                                            <div className="table-cell"><Icon size="2x" name="hourglass" /></div>
                                            <div className="table-cell"><Translate content="account.vesting.title" /></div>
                                        </li> : null}

                                        <li className={cnames({active: active.indexOf("/whitelist") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/whitelist`)}>
                                            <div className="table-cell"><Icon size="2x" name="list" /></div>
                                            <div className="table-cell"><Translate content="account.whitelist.title" /></div>
                                        </li>

                                        <li className={cnames("divider", {active: active.indexOf("/permissions") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/permissions`)}>
                                            <div className="table-cell"><Icon size="2x" name="warning" /></div>
                                            <div className="table-cell"><Translate content="account.permissions" /></div>
                                        </li>

                                        <li className={cnames({active: active.indexOf("/accounts") !== -1}, "divider")} onClick={this._onNavigate.bind(this, "/accounts")}>
                                            <div className="table-cell"><Icon size="2x" name="folder" /></div>
                                            <div className="table-cell"><Translate content="explorer.accounts.title" /></div>
                                        </li>

                                        {accountsList}
                                    </ul>
                                </div>]
                            }
                        </div>
                    </div>
                </div>
                {/* Send modal */}
                <SendModal id="send_modal_header" ref="send_modal" from_name={currentAccount} />
                {/* Deposit modal */}
                <DepositModal
                    ref="deposit_modal_new"
                    modalId="deposit_modal_new"
                    account={currentAccount}
                    backedCoins={this.props.backedCoins}
                />
            </div>

        );

    }
}

export default connect(Header, {
    listenTo() {
        return [AccountStore, WalletUnlockStore, WalletManagerStore, SettingsStore, GatewayStore];
    },
    getProps() {
        const chainID = Apis.instance().chain_id;
        return {
            backedCoins: GatewayStore.getState().backedCoins,
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
