import React from "react";
import { Link } from "react-router/es";
import { connect } from "alt-react";
import AccountStore from "stores/AccountStore";
import SendModal from "../Modal/SendModal";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import WalletUnlockStore from "stores/WalletUnlockStore";
import cnames from "classnames";
import ReactTooltip from "react-tooltip";
import { Apis } from "bitsharesjs-ws";
import { ChainStore } from "bitsharesjs";

var logo = require("assets/logo-ico-blue.png");

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
        this._toggleMobileMenu();
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
        const {active} = this.state;
        const {currentAccount} = this.props;
        const a = ChainStore.getAccount(currentAccount);
        const isMyAccount = !a ? false : AccountStore.isMyAccount(a);
        const enableDepositWithdraw = Apis.instance().chain_id.substr(0, 8) === "4018d784" && isMyAccount;
        const myAccounts = AccountStore.getMyAccounts();
        const myAccountCount = myAccounts.length;
        const tradeUrl = this.props.lastMarket ? `/market/${this.props.lastMarket}` : "/market/USD_BTS";
        const isWalletActive = active.indexOf("transfer") !== -1
            || active.indexOf("deposit-withdraw") !== -1
            || active.indexOf("overview") !== -1
            || active === `/account/${currentAccount}`;
        const isAccountActive = active.indexOf("member-stats") !== -1
            || active.indexOf("voting") !== -1
            || (active.indexOf("account") !== -1 && active.indexOf("assets") !== -1)
            || active.indexOf("signedmessages") !== -1
            || active.indexOf("vesting") !== -1
            || active.indexOf("whitelist") !== -1
            || active.indexOf("permissions") !== -1;
        const isExplorerActive = active.indexOf("explorer") !== -1;

        return (
            <div className={cnames({ active: this.state.open }) + " sidemenu-outer grid-block vertical"}>
                <div className="sidemenu-wrapper">
                    <div className="sidemenu">
                        <ul className="block-list">
                            <li><a href onClick={this._toggleMobileMenu.bind(this)} className="sidemenu-link"><Icon className="icon-2x" name="menu"/></a></li>
                            <li>
                                <a className="dashboard-link"
                                   onClick={this._onNavigate.bind(this, "/dashboard")}>
                                    <img src={logo} />
                                </a>
                            </li>
                            <li className={cnames({selected: isWalletActive, disabled: myAccountCount === 0, active: active === `/account/${currentAccount}`})}>
                                <a onClick={myAccountCount === 0 ? () => {} : this._onNavigate.bind(this, `/account/${currentAccount}`)}>
                                    <Icon name="dashboard"/>
                                    <Translate content="wallet.title" />
                                </a>
                                {isWalletActive ? (<ul>
                                    <li className={cnames({active: active.indexOf("/transfer") !== -1})}><a onClick={this._onNavigate.bind(this, "/transfer")}>
                                        <Icon name="transfer" />
                                        <Translate content="header.payments" />
                                    </a></li>

                                    {<li><a onClick={this._showSend.bind(this)}>
                                        <Icon name="transfer" />
                                        <Translate content="header.payments_beta" />
                                    </a></li>}

                                    <li className={cnames({active: active.indexOf("/deposit-withdraw") !== -1, disabled: !enableDepositWithdraw})}><a onClick={!enableDepositWithdraw ? () => {} : this._onNavigate.bind(this, "/deposit-withdraw")}>
                                        <Icon name="deposit" />
                                        <Translate content="gateway.deposit" />
                                    </a></li>
                                    <li className={cnames({active: active.indexOf("/deposit-withdraw") !== -1, disabled: !enableDepositWithdraw})}><a onClick={!enableDepositWithdraw ? () => {} : this._onNavigate.bind(this, "/deposit-withdraw")}>
                                        <Icon name="withdraw" />
                                        <Translate content="modal.withdraw.submit" />
                                    </a></li>
                                </ul>) : null}
                            </li>
                            <li className={cnames({selected: isAccountActive, disabled: myAccountCount === 0, active: active.indexOf("member-stats") !== -1})}>
                                <a onClick={myAccountCount === 0 ? () => {} : this._onNavigate.bind(this, `/account/${currentAccount}/member-stats`)}>
                                    <Icon name="user"/>
                                    <Translate content="header.account" />
                                </a>
                                {isAccountActive ? (<ul>
                                    <li className={cnames({active: active.indexOf("/voting") !== -1 && active.indexOf("/account") !== -1})}><a onClick={this._onNavigate.bind(this, `/account/${currentAccount}/voting`)}>
                                        <Icon name="thumbs-up" />
                                        <Translate content="account.voting" />
                                    </a></li>

                                    <li className={cnames({active: active.indexOf("/assets") !== -1 && active.indexOf("/account/") !== -1})}><a onClick={this._onNavigate.bind(this, `/account/${currentAccount}/assets`)}>
                                        <Icon name="assets" />
                                        <Translate content="explorer.assets.title" />
                                    </a></li>

                                    <li className={cnames({active: active.indexOf("/signedmessages") !== -1})}><a onClick={this._onNavigate.bind(this, `/account/${currentAccount}/signedmessages`)}>
                                        <Icon name="text" />
                                        <Translate content="account.signedmessages.menuitem" />
                                    </a></li>

                                    {isMyAccount ? <li className={cnames({active: active.indexOf("/vesting") !== -1})}><a onClick={this._onNavigate.bind(this, `/account/${currentAccount}/vesting`)}>
                                        <Icon name="hourglass" />
                                        <Translate content="account.vesting.title" />
                                    </a></li> : null}

                                    <li className={cnames({active: active.indexOf("/whitelist") !== -1})}><a onClick={this._onNavigate.bind(this, `/account/${currentAccount}/whitelist`)}>
                                        <Icon name="list" />
                                        <Translate content="account.whitelist.title" />
                                    </a></li>

                                    <li className={cnames({active: active.indexOf("/permissions") !== -1})}><a onClick={this._onNavigate.bind(this, `/account/${currentAccount}/permissions`)}>
                                        <Icon name="warning" />
                                        <Translate content="account.permissions" />
                                    </a></li>
                                </ul>) : null}
                            </li>
                            <li className={cnames({active: active.indexOf("market/") !== -1})}>
                                <a onClick={this._onNavigate.bind(this, tradeUrl)}>
                                    <Icon name="trade"/>
                                    <Translate component="span" content="header.exchange" />
                                </a>
                            </li>
                            <li className={cnames({active: active.indexOf("/news") !== -1})}>
                                <a onClick={this._onNavigate.bind(this, `/news`)}>
                                    <Icon name="news"/>
                                    <Translate content="news.news" />
                                </a>
                            </li>
                            <li className={cnames({active: active.indexOf("/explorer/blocks") !== -1 && isExplorerActive, selected: isExplorerActive})}>
                                <a onClick={this._onNavigate.bind(this, "/explorer/blocks")}>
                                    <Icon name="blocks"/>
                                    <Translate component="span" content="explorer.blocks.title" />
                                </a>
                                {isExplorerActive ? (<ul>
                                    <li className={cnames({active: active.indexOf("/explorer/assets") !== -1})}><a onClick={this._onNavigate.bind(this, `/explorer/assets`)}>
                                        <Icon name="assets" />
                                        <Translate content="explorer.assets.title" />
                                    </a></li>

                                    <li className={cnames({active: active.indexOf("/explorer/accounts") !== -1})}><a onClick={this._onNavigate.bind(this, `/explorer/accounts`)}>
                                        <Icon name="accounts" />
                                        <Translate content="explorer.accounts.title" />
                                    </a></li>

                                    <li className={cnames({active: active.indexOf("/explorer/witnesses") !== -1})}><a onClick={this._onNavigate.bind(this, `/explorer/witnesses`)}>
                                        <Icon name="witnesses" />
                                        <Translate content="explorer.witnesses.title" />
                                    </a></li>

                                    <li className={cnames({active: active.indexOf("/explorer/committee-members") !== -1})}><a onClick={this._onNavigate.bind(this, `/explorer/committee-members`)}>
                                        <Icon name="committee_members" />
                                        <Translate content="explorer.committee_members.title" />
                                    </a></li>

                                    <li className={cnames({active: active.indexOf("/explorer/markets") !== -1})}><a onClick={this._onNavigate.bind(this, `/explorer/markets`)}>
                                        <Icon name="markets" />
                                        <Translate content="markets.title" />
                                    </a></li>

                                    <li className={cnames({active: active.indexOf("/explorer/fees") !== -1})}><a onClick={this._onNavigate.bind(this, `/explorer/fees`)}>
                                        <Icon name="fees" />
                                        <Translate content="fees.title" />
                                    </a></li>
                                </ul>) : null}
                            </li>
                        </ul>
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
