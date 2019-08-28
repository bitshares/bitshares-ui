import React from "react";
import {connect} from "alt-react";
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
import {Apis} from "bitsharesjs-ws";
import AccountImage from "../Account/AccountImage";
import {ChainStore} from "bitsharesjs";
import WithdrawModal from "../Modal/WithdrawModalNew";
import {List} from "immutable";
import DropDownMenu from "./HeaderDropdown";
import {withRouter} from "react-router-dom";
import {Notification} from "bitshares-ui-style-guide";
import AccountBrowsingMode from "../Account/AccountBrowsingMode";
import {setLocalStorageType, isPersistantType} from "lib/common/localStorage";
import HeaderMenuItem from "./HeaderMenuItem";
import MenuItemType from "./MenuItemType";

import {getLogo} from "branding";
var logo = getLogo();

// const FlagImage = ({flag, width = 20, height = 20}) => {
//     return <img height={height} width={width} src={`${__BASE_URL__}language-dropdown/${flag.toUpperCase()}.png`} />;
// };

const SUBMENUS = {
    SETTINGS: "SETTINGS"
};

class Header extends React.Component {
    constructor(props) {
        super();
        this.state = {
            active: props.location.pathname,
            accountsListDropdownActive: false,
            dropdownActive: false,
            dropdownSubmenuActive: false,
            isDepositModalVisible: false,
            hasDepositModalBeenShown: false,
            isWithdrawModalVisible: false,
            hasWithdrawalModalBeenShown: false
        };

        this._accountNotificationActiveKeys = [];
        this.unlisten = null;
        this._toggleAccountDropdownMenu = this._toggleAccountDropdownMenu.bind(
            this
        );
        this._toggleDropdownMenu = this._toggleDropdownMenu.bind(this);
        this._closeDropdown = this._closeDropdown.bind(this);
        this._closeDropdownSubmenu = this._closeDropdownSubmenu.bind(this);
        this._toggleDropdownSubmenu = this._toggleDropdownSubmenu.bind(this);
        this._closeMenuDropdown = this._closeMenuDropdown.bind(this);
        this._closeAccountsListDropdown = this._closeAccountsListDropdown.bind(
            this
        );
        this._closeAccountNotifications = this._closeAccountNotifications.bind(
            this
        );

        this.showDepositModal = this.showDepositModal.bind(this);
        this.hideDepositModal = this.hideDepositModal.bind(this);

        this.showWithdrawModal = this.showWithdrawModal.bind(this);
        this.hideWithdrawModal = this.hideWithdrawModal.bind(this);

        this.onBodyClick = this.onBodyClick.bind(this);
    }

    showDepositModal() {
        this.setState({
            isDepositModalVisible: true,
            hasDepositModalBeenShown: true
        });
    }

    hideDepositModal() {
        this.setState({
            isDepositModalVisible: false
        });
    }

    showWithdrawModal() {
        this.setState({
            isWithdrawModalVisible: true,
            hasWithdrawalModalBeenShown: true
        });
    }

    hideWithdrawModal() {
        this.setState({
            isWithdrawModalVisible: false
        });
    }

    componentWillMount() {
        this.unlisten = this.props.history.listen(newState => {
            if (this.unlisten && this.state.active !== newState.pathname) {
                this.setState({
                    active: newState.pathname
                });
            }
        });
    }

    componentDidMount() {
        setTimeout(() => {
            ReactTooltip.rebuild();
        }, 1250);

        document.body.addEventListener("click", this.onBodyClick, {
            capture: false,
            passive: true
        });
    }

    componentWillUnmount() {
        if (this.unlisten) {
            this.unlisten();
            this.unlisten = null;
        }

        document.body.removeEventListener("click", this.onBodyClick);
    }

    componentWillReceiveProps(np) {
        if (
            np.passwordLogin !== this.props.passwordLogin &&
            this.state.active.includes("/settings/")
        ) {
            this.props.history.push("/settings/general");
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.myActiveAccounts !== this.props.myActiveAccounts ||
            nextProps.currentAccount !== this.props.currentAccount ||
            nextProps.passwordLogin !== this.props.passwordLogin ||
            nextProps.locked !== this.props.locked ||
            nextProps.current_wallet !== this.props.current_wallet ||
            nextProps.lastMarket !== this.props.lastMarket ||
            nextProps.starredAccounts !== this.props.starredAccounts ||
            nextProps.currentLocale !== this.props.currentLocale ||
            nextState.active !== this.state.active ||
            nextState.hiddenAssets !== this.props.hiddenAssets ||
            nextState.dropdownActive !== this.state.dropdownActive ||
            nextState.dropdownSubmenuActive !==
                this.state.dropdownSubmenuActive ||
            nextState.accountsListDropdownActive !==
                this.state.accountsListDropdownActive ||
            nextProps.height !== this.props.height ||
            nextProps.location.pathname !== this.props.location.pathname
        );
    }

    _showSend(e) {
        e.preventDefault();
        if (this.send_modal) this.send_modal.show();
        this._closeDropdown();
    }

    _showDeposit(e) {
        e.preventDefault();
        this.showDepositModal();
        this._closeDropdown();
    }

    _showWithdraw(e) {
        e.preventDefault();
        this._closeDropdown();
        this.showWithdrawModal();
    }

    _triggerMenu(e) {
        e.preventDefault();
        ZfApi.publish("mobile-menu", "toggle");
    }

    _toggleLock(e) {
        e.preventDefault();
        if (WalletDb.isLocked()) {
            WalletUnlockActions.unlock()
                .then(() => {
                    AccountActions.tryToSetCurrentAccount();
                })
                .catch(() => {});
        } else {
            WalletUnlockActions.lock();
            if (!WalletUnlockStore.getState().rememberMe) {
                if (!isPersistantType()) {
                    setLocalStorageType("persistant");
                }
                AccountActions.setPasswordAccount(null);
                AccountStore.tryToSetCurrentAccount();
            }
        }
        this._closeDropdown();
        this._closeAccountNotifications();
    }

    _onNavigate(route, e) {
        e.preventDefault();

        // Set Accounts Tab as active tab
        if (route == "/accounts") {
            SettingsActions.changeViewSetting({
                dashboardEntry: "accounts"
            });
        }

        this.props.history.push(route);
        this._closeDropdown();
    }

    _closeAccountsListDropdown() {
        if (this.state.accountsListDropdownActive) {
            this.setState({
                accountsListDropdownActive: false
            });
        }
    }

    _closeMenuDropdown() {
        if (this.state.dropdownActive) {
            this.setState({
                dropdownActive: false
            });
        }
    }

    _closeDropdownSubmenu() {
        if (this.state.dropdownSubmenuActive) {
            this.setState({
                dropdownSubmenuActive: false
            });
        }
    }

    _closeDropdown() {
        this._closeMenuDropdown();
        this._closeAccountsListDropdown();
        this._closeDropdownSubmenu();
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
        if (account_name !== this.props.currentAccount) {
            AccountActions.setCurrentAccount.defer(account_name);
            const key = `account-notification-${Date.now()}`;
            Notification.success({
                message: counterpart.translate("header.account_notify", {
                    account: account_name
                }),
                key,
                onClose: () => {
                    // Remove key of notification from notificationKeys array after close
                    this._accountNotificationActiveKeys = this._accountNotificationActiveKeys.filter(
                        el => el !== key
                    );
                }
            });

            this._accountNotificationActiveKeys.push(key);

            this._closeDropdown();
        }
    }

    _toggleAccountDropdownMenu() {
        // prevent state toggling if user cannot have multiple accounts

        const hasLocalWallet = !!WalletDb.getWallet();

        if (!hasLocalWallet) return false;
        this._closeAccountNotifications();
        this.setState({
            accountsListDropdownActive: !this.state.accountsListDropdownActive
        });
    }

    _toggleDropdownSubmenu(item = this.state.dropdownSubmenuActiveItem, e) {
        if (e) e.stopPropagation();

        this.setState({
            dropdownSubmenuActive: !this.state.dropdownSubmenuActive,
            dropdownSubmenuActiveItem: item
        });
    }

    _toggleDropdownMenu() {
        this.setState({
            dropdownActive: !this.state.dropdownActive
        });
        this._closeAccountNotifications();
    }

    _closeAccountNotifications() {
        this._accountNotificationActiveKeys.map(key => Notification.close(key));
        this._accountNotificationActiveKeys = [];
    }

    onBodyClick(e) {
        let el = e.target;
        let insideMenuDropdown = false;
        let insideAccountDropdown = false;

        do {
            if (
                el.classList &&
                el.classList.contains("account-dropdown-wrapper")
            ) {
                insideAccountDropdown = true;
                break;
            }

            if (
                el.classList &&
                el.classList.contains("menu-dropdown-wrapper")
            ) {
                insideMenuDropdown = true;
                break;
            }
        } while ((el = el.parentNode));

        if (!insideAccountDropdown) this._closeAccountsListDropdown();
        if (!insideMenuDropdown) {
            this._closeMenuDropdown();
            this._closeDropdownSubmenu();
        }
    }

    render() {
        let {active} = this.state;
        let {
            currentAccount,
            starredAccounts,
            passwordLogin,
            passwordAccount,
            height
        } = this.props;

        let tradingAccounts = AccountStore.getMyAccounts();
        let maxHeight = Math.max(40, height - 67 - 36) + "px";

        const a = ChainStore.getAccount(currentAccount);
        const showAccountLinks = !!a;
        const isMyAccount = !a
            ? false
            : AccountStore.isMyAccount(a) ||
              (passwordLogin && currentAccount === passwordAccount);
        const enableDepositWithdraw =
            !!a &&
            Apis.instance() &&
            Apis.instance().chain_id &&
            Apis.instance().chain_id.substr(0, 8) === "4018d784";

        if (starredAccounts.size) {
            for (let i = tradingAccounts.length - 1; i >= 0; i--) {
                if (!starredAccounts.has(tradingAccounts[i])) {
                    tradingAccounts.splice(i, 1);
                }
            }
            starredAccounts.forEach(account => {
                if (tradingAccounts.indexOf(account.name) === -1) {
                    tradingAccounts.push(account.name);
                }
            });
        }

        let myAccounts = AccountStore.getMyAccounts();
        let myAccountCount = myAccounts.length;

        let walletBalance =
            myAccounts.length && this.props.currentAccount ? (
                <div
                    className="total-value"
                    onClick={this._toggleAccountDropdownMenu}
                >
                    <TotalBalanceValue.AccountWrapper
                        hiddenAssets={this.props.hiddenAssets}
                        accounts={List([this.props.currentAccount])}
                        noTip
                        style={{minHeight: 15}}
                    />
                </div>
            ) : null;

        let dashboard = (
            <a
                className={cnames("logo", {
                    active:
                        active === "/" ||
                        (active.indexOf("dashboard") !== -1 &&
                            active.indexOf("account") === -1)
                })}
                onClick={this._onNavigate.bind(this, "/")}
            >
                <img style={{margin: 0, height: 40}} src={logo} />
            </a>
        );

        let createAccountLink = myAccountCount === 0 ? true : null;

        // let lock_unlock = ((!!this.props.current_wallet) || passwordLogin) ? (
        //     <div className="grp-menu-item" >
        //     { this.props.locked ?
        //         <a style={{padding: "1rem"}} href onClick={this._toggleLock.bind(this)} data-class="unlock-tooltip" data-offset="{'left': 50}" data-tip={locked_tip} data-place="bottom" data-html><Icon className="icon-14px" name="locked" title="icons.locked.common" /></a>
        //         : <a style={{padding: "1rem"}} href onClick={this._toggleLock.bind(this)} data-class="unlock-tooltip" data-offset="{'left': 50}" data-tip={unlocked_tip} data-place="bottom" data-html><Icon className="icon-14px" name="unlocked" title="icons.unlocked.common" /></a> }
        //     </div>
        // ) : null;

        let tradeUrl = this.props.lastMarket
            ? `/market/${this.props.lastMarket}`
            : "/market/USD_BTS";

        // Account selector: Only active inside the exchange
        let account_display_name, accountsList;
        if (currentAccount) {
            account_display_name =
                currentAccount.length > 20
                    ? `${currentAccount.slice(0, 20)}..`
                    : currentAccount;
            if (tradingAccounts.indexOf(currentAccount) < 0 && isMyAccount) {
                tradingAccounts.push(currentAccount);
            }
            if (tradingAccounts.length >= 1) {
                accountsList = tradingAccounts
                    .sort()
                    .filter(name => name !== currentAccount)
                    .map(name => {
                        return (
                            <li
                                key={name}
                                className={cnames({
                                    active:
                                        active
                                            .replace("/account/", "")
                                            .indexOf(name) === 0
                                })}
                                onClick={this._accountClickHandler.bind(
                                    this,
                                    name
                                )}
                            >
                                <div
                                    style={{paddingTop: 0}}
                                    className="table-cell"
                                >
                                    <AccountImage
                                        style={{position: "relative", top: 4}}
                                        size={{height: 20, width: 20}}
                                        account={name}
                                    />
                                </div>
                                <div
                                    className="table-cell"
                                    style={{paddingLeft: 10}}
                                >
                                    <a
                                        className={
                                            "text lower-case" +
                                            (name === account_display_name
                                                ? " current-account"
                                                : "")
                                        }
                                    >
                                        {name}
                                    </a>
                                </div>
                            </li>
                        );
                    });
            }
        }

        let hamburger = this.state.dropdownActive ? (
            <Icon
                className="icon-14px"
                name="hamburger-x"
                title="icons.hamburger_x"
            />
        ) : (
            <Icon
                className="icon-14px"
                name="hamburger"
                title="icons.hamburger"
            />
        );
        const hasLocalWallet = !!WalletDb.getWallet();

        const submenus = {
            [SUBMENUS.SETTINGS]: (
                <ul
                    className="dropdown header-menu header-submenu"
                    style={{
                        left: -200,
                        top: 64,
                        maxHeight: !this.state.dropdownActive ? 0 : maxHeight,
                        overflowY: "auto"
                    }}
                >
                    <li
                        className="parent-item"
                        onClick={this._toggleDropdownSubmenu.bind(
                            this,
                            undefined
                        )}
                    >
                        <div className="table-cell">
                            <span className="parent-item-icon">&lt;</span>
                            <Translate
                                content="header.settings"
                                component="span"
                                className="parent-item-name"
                            />
                        </div>
                    </li>
                    <li className="divider" />
                    <li
                        onClick={this._onNavigate.bind(
                            this,
                            "/settings/general"
                        )}
                    >
                        <Translate
                            content="settings.general"
                            component="div"
                            className="table-cell"
                        />
                    </li>
                    {!this.props.settings.get("passwordLogin") && (
                        <li
                            onClick={this._onNavigate.bind(
                                this,
                                "/settings/wallet"
                            )}
                        >
                            <Translate
                                content="settings.wallet"
                                component="div"
                                className="table-cell"
                            />
                        </li>
                    )}
                    <li
                        onClick={this._onNavigate.bind(
                            this,
                            "/settings/accounts"
                        )}
                    >
                        <Translate
                            content="settings.accounts"
                            component="div"
                            className="table-cell"
                        />
                    </li>

                    {!this.props.settings.get("passwordLogin") && [
                        <li
                            key={"settings.password"}
                            onClick={this._onNavigate.bind(
                                this,
                                "/settings/password"
                            )}
                        >
                            <Translate
                                content="settings.password"
                                component="div"
                                className="table-cell"
                            />
                        </li>,
                        <li
                            key={"settings.backup"}
                            onClick={this._onNavigate.bind(
                                this,
                                "/settings/backup"
                            )}
                        >
                            <Translate
                                content="settings.backup"
                                component="div"
                                className="table-cell"
                            />
                        </li>,
                        <li
                            key={"settings.restore"}
                            onClick={this._onNavigate.bind(
                                this,
                                "/settings/restore"
                            )}
                        >
                            <Translate
                                content="settings.restore"
                                component="div"
                                className="table-cell"
                            />
                        </li>
                    ]}

                    <li
                        onClick={this._onNavigate.bind(
                            this,
                            "/settings/access"
                        )}
                    >
                        <Translate
                            content="settings.access"
                            component="div"
                            className="table-cell"
                        />
                    </li>
                    <li
                        onClick={this._onNavigate.bind(
                            this,
                            "/settings/faucet_address"
                        )}
                    >
                        <Translate
                            content="settings.faucet_address"
                            component="div"
                            className="table-cell"
                        />
                    </li>
                    <li
                        onClick={this._onNavigate.bind(this, "/settings/reset")}
                    >
                        <Translate
                            content="settings.reset"
                            component="div"
                            className="table-cell"
                        />
                    </li>
                </ul>
            )
        };

        return (
            <div className="header-container" style={{minHeight: "64px"}}>
                <div>
                    <div
                        className="header menu-group primary"
                        style={{flexWrap: "nowrap", justifyContent: "none"}}
                    >
                        {__ELECTRON__ ? (
                            <div className="grid-block show-for-medium shrink electron-navigation">
                                <ul className="menu-bar">
                                    <li>
                                        <div
                                            style={{
                                                marginLeft: "1rem",
                                                height: "3rem"
                                            }}
                                        >
                                            <div
                                                style={{marginTop: "0.5rem"}}
                                                onClick={this._onGoBack.bind(
                                                    this
                                                )}
                                                className="button outline small"
                                            >
                                                {"<"}
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <div
                                            style={{
                                                height: "3rem",
                                                marginLeft: "0.5rem",
                                                marginRight: "0.75rem"
                                            }}
                                        >
                                            <div
                                                style={{marginTop: "0.5rem"}}
                                                onClick={this._onGoForward.bind(
                                                    this
                                                )}
                                                className="button outline small"
                                            >
                                                >
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        ) : null}

                        <ul className="menu-bar">
                            <li>{dashboard}</li>

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern={["account/", "/account/"]}
                                excludePattern={[
                                    "/assets",
                                    "/voting",
                                    "/signedmessages",
                                    "/member-stats",
                                    "/vesting",
                                    "/whitelist",
                                    "/permissions"
                                ]}
                                target={`/account/${currentAccount}`}
                                icon={{
                                    name: "dashboard"
                                }}
                                text="header.dashboard"
                                hidden={currentAccount && !createAccountLink}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                hideClassName="column-hide-xxs"
                                includePattern="market/"
                                target={this._onNavigate.bind(this, tradeUrl)}
                                icon={{
                                    name: "trade",
                                    title: "icons.trade.exchange"
                                }}
                                text="header.exchange"
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                hideClassName="column-hide-xs"
                                includePattern="explorer"
                                target={this._onNavigate.bind(
                                    this,
                                    "/explorer/blocks"
                                )}
                                icon={{
                                    name: "server",
                                    size: "2x"
                                }}
                                text="header.explorer"
                            />

                            {/*<HeaderMenuItem
                                currentPath={active}
                                hideClassName="column-hide-xs"
                                includePattern="showcases"
                                target={this._onNavigate.bind(
                                    this,
                                    "/showcases"
                                )}
                                icon={{
                                    name: "showcases",
                                    size: "2x"
                                }}
                                text="header.showcases"
                            />*/}

                            {/* Dynamic Menu Items */}
                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="transfer"
                                icon={{
                                    name: "transfer"
                                }}
                                text="header.payments"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="spotlight"
                                icon={{
                                    name: "showcases"
                                }}
                                text="header.showcases"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="settings"
                                icon={{
                                    name: "cogs"
                                }}
                                text="header.settings"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="deposit-withdraw"
                                icon={{
                                    name: "deposit-withdraw",
                                    title: "icons.deposit.deposit_withdraw"
                                }}
                                text="header.deposit-withdraw"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="news"
                                icon={{
                                    name: "news"
                                }}
                                text="news.news"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="help"
                                icon={{
                                    name: "question-circle",
                                    title: "icons.question_circle"
                                }}
                                text="header.help"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/voting"
                                icon={{
                                    name: "thumbs-up",
                                    title: "icons.thumbs_up"
                                }}
                                text="account.voting"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/assets"
                                excludePattern="explorer"
                                icon={{
                                    name: "assets"
                                }}
                                text="explorer.assets.title"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/signedmessages"
                                icon={{
                                    name: "text",
                                    title: "icons.text.signed_messages"
                                }}
                                text="account.signedmessages.menuitem"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/member-stats"
                                icon={{
                                    name: "text",
                                    title: "icons.text.membership_stats"
                                }}
                                text="account.member.stats"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/vesting"
                                icon={{
                                    name: "hourglass"
                                }}
                                text="account.vesting.title"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/whitelist"
                                icon={{
                                    name: "list"
                                }}
                                text="account.whitelist.title"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/permissions"
                                icon={{
                                    name: "warning"
                                }}
                                text="account.permissions"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/borrow"
                                icon={{
                                    name: "borrow"
                                }}
                                text="showcases.borrow.title"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/barter"
                                icon={{
                                    name: "barter"
                                }}
                                text="showcases.barter.title"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/direct-debit"
                                icon={{
                                    name: "direct_debit"
                                }}
                                text="showcases.direct_debit.title"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/prediction"
                                icon={{
                                    name: "prediction-large"
                                }}
                                text="showcases.prediction_market.title"
                                behavior={MenuItemType.Dynamic}
                            />

                            <HeaderMenuItem
                                currentPath={active}
                                includePattern="/htlc"
                                icon={{
                                    name: "htlc"
                                }}
                                text="showcases.htlc.title_short"
                                behavior={MenuItemType.Dynamic}
                            />
                        </ul>
                    </div>
                </div>

                <div
                    className="truncated active-account"
                    style={{cursor: "pointer"}}
                >
                    <AccountBrowsingMode location={this.props.location} />
                    <div>
                        <div className="text account-name">
                            <span onClick={this._toggleAccountDropdownMenu}>
                                {currentAccount}
                            </span>
                            <AccountBrowsingMode
                                location={this.props.location}
                                usernameViewIcon
                            />
                        </div>
                        {walletBalance}
                    </div>

                    {hasLocalWallet && (
                        <ul
                            className="dropdown header-menu local-wallet-menu"
                            style={{
                                right: 0,
                                maxHeight: !this.state
                                    .accountsListDropdownActive
                                    ? 0
                                    : maxHeight,
                                overflowY: "auto",
                                position: "absolute",
                                width: "20em"
                            }}
                        >
                            <li
                                className={cnames(
                                    {
                                        active:
                                            active.indexOf("/accounts") !== -1
                                    },
                                    "divider"
                                )}
                                onClick={this._onNavigate.bind(
                                    this,
                                    "/accounts"
                                )}
                            >
                                <div className="table-cell">
                                    <Icon
                                        size="2x"
                                        name="people"
                                        title="icons.manage_accounts"
                                    />
                                </div>
                                <div className="table-cell">
                                    <Translate content="header.accounts_manage" />
                                </div>
                            </li>
                            {accountsList}
                        </ul>
                    )}
                </div>
                <div>
                    {this.props.currentAccount == null ? null : (
                        <span
                            onClick={this._toggleLock.bind(this)}
                            style={{cursor: "pointer"}}
                        >
                            <Icon
                                className="lock-unlock"
                                size="2x"
                                name={this.props.locked ? "locked" : "unlocked"}
                                title={
                                    this.props.locked
                                        ? "icons.locked.common"
                                        : "icons.unlocked.common"
                                }
                            />
                        </span>
                    )}
                </div>
                <div className="app-menu">
                    <div
                        onClick={this._toggleDropdownMenu}
                        className={cnames(
                            "menu-dropdown-wrapper dropdown-wrapper",
                            {active: this.state.dropdownActive}
                        )}
                    >
                        <div className="hamburger">{hamburger}</div>

                        {(this.state.dropdownSubmenuActive &&
                            submenus[this.state.dropdownSubmenuActiveItem] &&
                            submenus[this.state.dropdownSubmenuActiveItem]) || (
                            <DropDownMenu
                                dropdownActive={this.state.dropdownActive}
                                toggleLock={this._toggleLock.bind(this)}
                                maxHeight={maxHeight}
                                locked={this.props.locked}
                                active={active}
                                passwordLogin={passwordLogin}
                                onNavigate={this._onNavigate.bind(this)}
                                isMyAccount={isMyAccount}
                                contacts={this.props.contacts}
                                showAccountLinks={showAccountLinks}
                                tradeUrl={tradeUrl}
                                currentAccount={currentAccount}
                                enableDepositWithdraw={enableDepositWithdraw}
                                showDeposit={this._showDeposit.bind(this)}
                                showWithdraw={this._showWithdraw.bind(this)}
                                showSend={this._showSend.bind(this)}
                                toggleDropdownSubmenu={this._toggleDropdownSubmenu.bind(
                                    this,
                                    SUBMENUS.SETTINGS
                                )}
                            />
                        )}
                    </div>
                </div>
                <SendModal
                    id="send_modal_header"
                    refCallback={e => {
                        if (e) this.send_modal = e;
                    }}
                    from_name={currentAccount}
                />
                {this.state.hasDepositModalBeenShown && (
                    <DepositModal
                        visible={this.state.isDepositModalVisible}
                        hideModal={this.hideDepositModal}
                        showModal={this.showDepositModal}
                        ref="deposit_modal_new"
                        modalId="deposit_modal_new"
                        account={currentAccount}
                        backedCoins={this.props.backedCoins}
                    />
                )}
                {this.state.hasWithdrawalModalBeenShown && (
                    <WithdrawModal
                        visible={this.state.isWithdrawModalVisible}
                        hideModal={this.hideWithdrawModal}
                        showModal={this.showWithdrawModal}
                        ref="withdraw_modal_new"
                        modalId="withdraw_modal_new"
                        backedCoins={this.props.backedCoins}
                    />
                )}
            </div>
        );
    }
}

Header = connect(
    Header,
    {
        listenTo() {
            return [
                AccountStore,
                WalletUnlockStore,
                WalletManagerStore,
                SettingsStore,
                GatewayStore
            ];
        },
        getProps() {
            const chainID = Apis.instance().chain_id;
            return {
                backedCoins: GatewayStore.getState().backedCoins,
                myActiveAccounts: AccountStore.getState().myActiveAccounts,
                currentAccount:
                    AccountStore.getState().currentAccount ||
                    AccountStore.getState().passwordAccount,
                passwordAccount: AccountStore.getState().passwordAccount,
                locked: WalletUnlockStore.getState().locked,
                current_wallet: WalletManagerStore.getState().current_wallet,
                lastMarket: SettingsStore.getState().viewSettings.get(
                    `lastMarket${chainID ? "_" + chainID.substr(0, 8) : ""}`
                ),
                starredAccounts: AccountStore.getState().starredAccounts,
                passwordLogin: SettingsStore.getState().settings.get(
                    "passwordLogin"
                ),
                currentLocale: SettingsStore.getState().settings.get("locale"),
                hiddenAssets: SettingsStore.getState().hiddenAssets,
                settings: SettingsStore.getState().settings,
                locales: SettingsStore.getState().defaults.locale,
                contacts: AccountStore.getState().accountContacts
            };
        }
    }
);

export default withRouter(Header);
