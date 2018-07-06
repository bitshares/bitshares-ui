import React from "react";
import {connect} from "alt-react";
import AccountStore from "stores/AccountStore";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import TranslateWithLinks from "./Utility/TranslateWithLinks";
import {isIncognito} from "feature_detect";
import SettingsActions from "actions/SettingsActions";
import WalletUnlockActions from "actions/WalletUnlockActions";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import SettingsStore from "stores/SettingsStore";
import IntlActions from "actions/IntlActions";
import CreateAccount from "./Account/CreateAccount";
import CreateAccountPassword from "./Account/CreateAccountPassword";
import {Route} from "react-router-dom";
import {getWalletName, getLogo} from "branding";
var logo = getLogo();

const FlagImage = ({flag, width = 50, height = 50}) => {
    return (
        <img
            height={height}
            width={width}
            src={`${__BASE_URL__}language-dropdown/${flag.toUpperCase()}.png`}
        />
    );
};

class LoginSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            step: 1,
            locales: SettingsStore.getState().defaults.locale,
            currentLocale: SettingsStore.getState().settings.get("locale")
        };
    }

    // componentDidUpdate() {
    // const myAccounts = AccountStore.getMyAccounts();

    // use ChildCount to make sure user is on /create-account page except /create-account/*
    // to prevent redirect when user just registered and need to make backup of wallet or password
    // const childCount = React.Children.count(this.props.children);

    // do redirect to portfolio if user already logged in
    // if (
    //     this.props.history &&
    //     Array.isArray(myAccounts) &&
    //     myAccounts.length !== 0 &&
    //     childCount === 0
    // )
    //     this.props.history.push("/account/" + this.props.currentAccount);
    // }

    componentWillMount() {
        isIncognito(incognito => {
            this.setState({incognito});
        });
    }

    onSelect(route) {
        this.props.history.push("/create-account/" + route);
    }

    render() {
        const translator = require("counterpart");

        const flagDropdown = (
            <ActionSheet>
                <ActionSheet.Button title="" style={{width: "64px"}}>
                    <a
                        style={{padding: "1rem", border: "none"}}
                        className="button arrow-down"
                    >
                        <FlagImage flag={this.state.currentLocale} />
                    </a>
                </ActionSheet.Button>
                <ActionSheet.Content>
                    <ul className="no-first-element-top-border">
                        {this.state.locales.map(locale => {
                            return (
                                <li key={locale}>
                                    <a
                                        onClick={e => {
                                            e.preventDefault();
                                            IntlActions.switchLocale(locale);
                                            this.setState({
                                                currentLocale: locale
                                            });
                                        }}
                                    >
                                        <div className="table-cell">
                                            <FlagImage
                                                width="20"
                                                height="20"
                                                flag={locale}
                                            />
                                        </div>
                                        <div
                                            className="table-cell"
                                            style={{paddingLeft: 10}}
                                        >
                                            <Translate
                                                content={"languages." + locale}
                                            />
                                        </div>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </ActionSheet.Content>
            </ActionSheet>
        );

        return (
            <div className="grid-block align-center" id="accountForm">
                <div className="grid-block shrink vertical">
                    <div className="grid-content shrink text-center account-creation">
                        <div>
                            <img src={logo} />
                        </div>

                        <div>
                            <Translate
                                content="header.create_account"
                                component="h4"
                            />
                        </div>

                        <div>
                            <Translate
                                content="account.intro_text_title"
                                component="h4"
                                wallet_name={getWalletName()}
                            />
                            <Translate
                                unsafe
                                content="account.intro_text_1"
                                component="p"
                            />

                            <div className="shrink text-center">
                                <div className="grp-menu-item overflow-visible account-drop-down">
                                    <div
                                        className="grp-menu-item overflow-visible"
                                        style={{margin: "0 auto"}}
                                        data-intro={translator.translate(
                                            "walkthrough.language_flag"
                                        )}
                                    >
                                        {flagDropdown}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid-block account-login-options">
                            <Link
                                id="account_login_button"
                                to="/create-account/password"
                                className="button primary"
                                data-intro={translator.translate(
                                    "walkthrough.create_cloud_wallet"
                                )}
                            >
                                <Translate content="header.create_account" />
                            </Link>

                            <span
                                className="button hollow primary"
                                onClick={() => {
                                    SettingsActions.changeSetting.defer({
                                        setting: "passwordLogin",
                                        value: true
                                    });
                                    WalletUnlockActions.unlock().catch(
                                        () => {}
                                    );
                                }}
                            >
                                <Translate content="header.unlock_short" />
                            </span>
                        </div>

                        <div className="additional-account-options">
                            <h5 style={{textAlign: "center"}}>
                                <TranslateWithLinks
                                    string="account.optional.formatter"
                                    keys={[
                                        {
                                            type: "link",
                                            value: "/wallet/backup/restore",
                                            translation:
                                                "account.optional.restore_link",
                                            dataIntro: translator.translate(
                                                "walkthrough.restore_account"
                                            ),
                                            arg: "restore_link"
                                        },
                                        {
                                            type: "link",
                                            value: "/create-account/wallet",
                                            translation:
                                                "account.optional.restore_form",
                                            dataIntro: translator.translate(
                                                "walkthrough.create_local_wallet"
                                            ),
                                            arg: "restore_form"
                                        }
                                    ]}
                                />
                            </h5>
                        </div>

                        <Route
                            path="/create-account/wallet"
                            exact
                            component={CreateAccount}
                        />
                        <Route
                            path="/create-account/password"
                            exact
                            component={CreateAccountPassword}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(LoginSelector, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            currentAccount:
                AccountStore.getState().currentAccount ||
                AccountStore.getState().passwordAccount
        };
    }
});
