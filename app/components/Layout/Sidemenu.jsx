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
            active: context.location.pathname
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
            nextState.active !== this.state.active
        );
    }

    _showSend(e) {
        e.preventDefault();
        this.refs.send_modal.show();
        this._closeSidemenu();
    }

    _onNavigate(route, e) {
        e.preventDefault();
        this.context.router.push(route);
        this._closeSidemenu();
    }

    _closeSidemenu() {
        ZfApi.publish("sidemenu", "close");
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

        if(!insideSidemenu) this._closeSidemenu();
    }

    render() {
        let {active} = this.state;
        let {currentAccount} = this.props;

        let myAccounts = AccountStore.getMyAccounts();
        let myAccountCount = myAccounts.length;

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

        let tradeUrl = this.props.lastMarket ? `/market/${this.props.lastMarket}` : "/market/USD_BTS";
        let tradeLink = <a style={{flexFlow: "row"}} className={cnames({active: active.indexOf("market/") !== -1})} onClick={this._onNavigate.bind(this, tradeUrl)}>
                <Icon name="trade"/>
                <Translate component="span" content="header.exchange" />
            </a>;

        return (
            <div>
                <Panel className="sidemenu" id="sidemenu" position="left">
                    <section className="block-list">
                        <ul className="sidemenu-list">
                            <li>{dashboard}</li>
                            {!currentAccount || !!createAccountLink ? null :
                            <li>
                                <a style={{flexFlow: "row"}} onClick={this._onNavigate.bind(this, `/account/${currentAccount}/overview`)} className={cnames({active: active.indexOf("account/") !== -1 && active.indexOf("dashboard") !== -1})}>
                                    <Icon name="dashboard"/>
                                    <Translate content="header.dashboard" />
                                </a>
                            </li>}
                            <li>{tradeLink}</li>
                            {/* {currentAccount || myAccounts.length ? <li><a className={cnames({active: active.indexOf("transfer") !== -1})} onClick={this._onNavigate.bind(this, "/transfer")}><Translate component="span" content="header.payments" /></a></li> : null} */}
                            <li>
                                <a style={{flexFlow: "row"}} className={cnames({active: active.indexOf("explorer") !== -1})} onClick={this._onNavigate.bind(this, "/explorer")}>
                                    <Icon name="server"/>
                                    <Translate component="span" content="header.explorer" />
                                </a>
                            </li>
                            {!!createAccountLink ? null : <li>
                                <a style={{flexFlow: "row"}} onClick={this._showSend.bind(this)}>
                                    <Icon name="transfer"/>
                                    <span><Translate content="header.payments_beta" /></span>
                                </a>
                            </li>}

                            {!!createAccountLink ? <li>
                                <a style={{flexFlow: "row"}} className={cnames({active: active.indexOf("settings") !== -1})} onClick={this._onNavigate.bind(this, "/settings")}>
                                    <Icon name="cogs"/>
                                    <span><Translate content="header.settings" /></span>
                                </a>
                            </li> : null}
                            {/* {enableDepositWithdraw && currentAccount && myAccounts.indexOf(currentAccount) !== -1 ? <li><Link to={"/deposit-withdraw/"} activeClassName="active"><Translate content="account.deposit_withdraw"/></Link></li> : null} */}
                        </ul>
                    </section>
                </Panel>
                {/* Send modal */}
                <SendModal ref="send_modal" from_name={currentAccount} />
            </div>
        );

    }
}

export default connect(Sidemenu, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        const chainID = Apis.instance().chain_id;
        return {
            currentAccount: AccountStore.getState().currentAccount || AccountStore.getState().passwordAccount,
        };
    }
});
