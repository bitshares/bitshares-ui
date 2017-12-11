import React from "react";
import {Link} from "react-router/es";
import { connect } from "alt-react";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import SendModal from "../Modal/SendModal";
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
import Panel from "react-foundation-apps/src/panel";
// import IntlActions from "actions/IntlActions";
import AccountImage from "../Account/AccountImage";
import {ChainStore} from "bitsharesjs";

var logo = require("assets/logo-ico-blue.png");

// const FlagImage = ({flag, width = 20, height = 20}) => {
//     return <img height={height} width={width} src={`${__BASE_URL__}language-dropdown/${flag.toUpperCase()}.png`} />;
// };

class Sidemenu extends React.Component {

    static contextTypes = {
        location: React.PropTypes.object.isRequired,
        router: React.PropTypes.object.isRequired
    };

    constructor(props, context) {
        super();
        this.state = {
            active: context.location.pathname,
            open: false
        };

        this.unlisten = null;
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
            nextProps.currentAccount !== this.props.currentAccount ||
            nextProps.passwordLogin !== this.props.passwordLogin ||
            nextProps.locked !== this.props.locked ||
            nextState.active !== this.state.active ||
            nextState.open !== this.state.open
        );
    }

    _showSend(e) {
        e.preventDefault();
        this.refs.send_modal.show();
        this._toogleMobileMenu();
    }

    _onNavigate(route, e) {
        e.preventDefault();
        this.context.router.push(route);
        this._toggleMobileMenu();
    }

  _toggleMobileMenu(e) {
        e && e.preventDefault();
        this.setState({
            open: !this.state.open
        });
    }

    onBodyClick(e) {
        let el = e.target;
        let insideSidemenu = false;

        do {
            if(el.classList && (el.classList.contains("sidemenu") || el.classList.contains("sidemenu-link"))) {
                insideSidemenu = true;
                break;
            }

        } while ((el = el.parentNode));

        if(!insideSidemenu && this.state.open) this._toggleMobileMenu();
    }

    render() {
        let {active} = this.state;
        let {currentAccount} = this.props;
        const a = ChainStore.getAccount(currentAccount);
        const isMyAccount = !a ? false : AccountStore.isMyAccount(a);
        const enableDepositWithdraw = Apis.instance().chain_id.substr(0, 8) === "4018d784" && isMyAccount;
        let myAccounts = AccountStore.getMyAccounts();
        let myAccountCount = myAccounts.length;

        let dashboard = (
            <a
                className="dashboard-link"
                style={{ paddingLeft: ".5rem", height: "3.84rem" }}
                onClick={this._onNavigate.bind(this, "/dashboard")}
            >
                <img style={{height: "2.64rem", width: "2rem"}} src={logo} />
            </a>
        );

        let tradeUrl = this.props.lastMarket ? `/market/${this.props.lastMarket}` : "/market/USD_BTS";
        let tradeLink = <a style={{flexFlow: "row"}} className={cnames({active: active.indexOf("market/") !== -1})} onClick={this._onNavigate.bind(this, tradeUrl)}>
                <Icon name="trade"/>
                <Translate component="span" content="header.exchange" />
            </a>;
        let isWalletActive = active.indexOf("transfer") !== -1
            || active.indexOf("deposit-withdraw") !== -1
            || active.indexOf("overview") !== -1;
        let isAccountActive = active.indexOf("member-stats") !== -1
            || active.indexOf("voting") !== -1
            || active.indexOf("assets") !== -1
            || active.indexOf("voting") !== -1
            || active.indexOf("signedmessages") !== -1
            || active.indexOf("vesting") !== -1
            || active.indexOf("whitelist") !== -1
            || active.indexOf("permissions") !== -1

        return (
            <div className={cnames({ active: this.state.open }) + " sidemenu-outer grid-block vertical"}>
                <div className="sidemenu-wrapper">
                    <div className="sidemenu">
                        <section className="block-list">
                            <ul className="sidemenu-list">
                                <li><a href style={{ width: "3.84rem", height: "3.84rem", padding: ".92rem" }} onClick={this._toggleMobileMenu.bind(this)} className="sidemenu-link"><Icon className="icon-2x" name="menu"/></a></li>
                                <li>{dashboard}</li>
                                <li>
                                    <a onClick={myAccountCount === 0 ? () => {} : this._onNavigate.bind(this, `/account/${currentAccount}/overview`)} className={cnames({selected: isWalletActive, disabled: myAccountCount === 0, active: active.indexOf("account/") !== -1 && active.indexOf("dashboard") !== -1})}>
                                        <Icon name="dashboard"/>
                                        <Translate content="wallet.title" />
                                    </a>
                                    {isWalletActive && isMyAccount ? (<section className="block-list">
                                        <ul className="sidemenu-list">

                                            <li><a className={cnames({active: active.indexOf("/transfer") !== -1})} onClick={!isMyAccount ? () => {} : this._onNavigate.bind(this, "/transfer")}>
                                                <Icon name="transfer" />
                                                <Translate content="header.payments" />
                                            </a></li>

                                            {<li><a onClick={this._showSend.bind(this)}>
                                                <Icon name="transfer" />
                                                <Translate content="header.payments_beta" />
                                            </a></li>}

                                            <li><a className={cnames({active: active.indexOf("/deposit-withdraw") !== -1})} onClick={!enableDepositWithdraw ? () => {} : this._onNavigate.bind(this, "/deposit-withdraw")}>
                                                <Icon name="deposit" />
                                                <Translate content="gateway.deposit" />
                                            </a></li>
                                            <li><a className={cnames({active: active.indexOf("/deposit-withdraw") !== -1})} onClick={!enableDepositWithdraw ? () => {} : this._onNavigate.bind(this, "/deposit-withdraw")}>
                                                <Icon name="withdraw" />
                                                <Translate content="modal.withdraw.submit" />
                                            </a></li>
                                        </ul>
                                    </section>) : null}
                                </li>
                                <li>
                                    <a onClick={myAccountCount === 0 ? () => {} : this._onNavigate.bind(this, `/account/${currentAccount}/member-stats`)} className={cnames({selected: isAccountActive, disabled: myAccountCount === 0, active: active.indexOf("member-stats") !== -1})}>
                                        <Icon name="user"/>
                                        <Translate content="header.account" />
                                    </a>
                                    {isAccountActive && isMyAccount ? (<section className="block-list">
                                        <ul className="sidemenu-list">

                                            <li><a className={cnames({active: active.indexOf("/voting") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/voting`)}>
                                                <Icon name="thumbs-up" />
                                                <Translate content="account.voting" />
                                            </a></li>

                                            <li><a className={cnames({active: active.indexOf("/assets") !== -1 && active.indexOf("/account/") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/assets`)}>
                                                <Icon name="assets" />
                                                <Translate content="explorer.assets.title" />
                                            </a></li>

                                            <li><a className={cnames({active: active.indexOf("/signedmessages") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/signedmessages`)}>
                                                <Icon name="text" />
                                                <Translate content="account.signedmessages.menuitem" />
                                            </a></li>

                                            {isMyAccount ? <li><a className={cnames({active: active.indexOf("/vesting") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/vesting`)}>
                                                <Icon name="hourglass" />
                                                <Translate content="account.vesting.title" />
                                            </a></li> : null}

                                            <li><a className={cnames({active: active.indexOf("/whitelist") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/whitelist`)}>
                                                <Icon name="list" />
                                                <Translate content="account.whitelist.title" />
                                            </a></li>

                                            <li><a className={cnames("divider", {active: active.indexOf("/permissions") !== -1})} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/permissions`)}>
                                                <Icon name="warning" />
                                                <Translate content="account.permissions" />
                                            </a></li>

                                        </ul>
                                    </section>) : null}
                                </li>
                                <li>{tradeLink}</li>
                                <li>
                                    <a style={{flexFlow: "row"}} className={cnames({active: active.indexOf("explorer") !== -1})} onClick={this._onNavigate.bind(this, "/explorer")}>
                                        <Icon name="server"/>
                                        <Translate component="span" content="header.explorer" />
                                    </a>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
                {/* Send modal */}
                <SendModal ref="send_modal" from_name={currentAccount} />
            </div>
        );

    }
}

export default connect(Sidemenu, {
    listenTo() {
        return [AccountStore, WalletUnlockStore];
    },
    getProps() {
        const chainID = Apis.instance().chain_id;
        return {
            currentAccount: AccountStore.getState().currentAccount || AccountStore.getState().passwordAccount,
            locked: WalletUnlockStore.getState().locked,
        };
    }
});
