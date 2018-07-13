import React from "react";
import Immutable from "immutable";
import DashboardList from "./DashboardList";
import {RecentTransactions} from "../Account/RecentTransactions";
import LoadingIndicator from "../LoadingIndicator";
import LoginSelector from "../LoginSelector";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import AccountStore from "stores/AccountStore";
import MarketsStore from "stores/MarketsStore";
import {Tabs, Tab} from "../Utility/Tabs";
import AltContainer from "alt-container";

class AccountsContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AccountStore, SettingsStore, MarketsStore]}
                inject={{
                    contacts: () => {
                        return AccountStore.getState().accountContacts;
                    },
                    myActiveAccounts: () => {
                        return AccountStore.getState().myActiveAccounts;
                    },
                    myHiddenAccounts: () => {
                        return AccountStore.getState().myHiddenAccounts;
                    },
                    accountsReady: () => {
                        return (
                            AccountStore.getState().accountsLoaded &&
                            AccountStore.getState().refsLoaded
                        );
                    },
                    passwordAccount: () => {
                        return AccountStore.getState().passwordAccount;
                    },
                    lowVolumeMarkets: () => {
                        return MarketsStore.getState().lowVolumeMarkets;
                    },
                    currentEntry: SettingsStore.getState().viewSettings.get(
                        "dashboardEntry",
                        "accounts"
                    )
                }}
            >
                <Accounts {...this.props} />
            </AltContainer>
        );
    }
}

class Accounts extends React.Component {
    constructor(props) {
        super();

        this.state = {
            width: null,
            showIgnored: false,
            currentEntry: props.currentEntry
        };

        this._setDimensions = this._setDimensions.bind(this);
    }

    componentDidMount() {
        this._setDimensions();

        window.addEventListener("resize", this._setDimensions, {
            capture: false,
            passive: true
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.myActiveAccounts !== this.props.myActiveAccounts ||
            nextProps.contacts !== this.props.contacts ||
            nextProps.ignoredAccounts !== this.props.ignoredAccounts ||
            nextProps.passwordAccount !== this.props.passwordAccount ||
            nextState.width !== this.state.width ||
            nextProps.accountsReady !== this.props.accountsReady ||
            nextState.showIgnored !== this.state.showIgnored ||
            nextState.currentEntry !== this.state.currentEntry
        );
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setDimensions);
    }

    _setDimensions() {
        let width = window.innerWidth;

        if (width !== this.state.width) {
            this.setState({width});
        }
    }

    _onToggleIgnored() {
        this.setState({
            showIgnored: !this.state.showIgnored
        });
    }

    _onSwitchType(type) {
        this.setState({
            currentEntry: type
        });
        SettingsActions.changeViewSetting({
            dashboardEntry: type
        });
    }

    render() {
        let {
            myActiveAccounts,
            myHiddenAccounts,
            accountsReady,
            passwordAccount
        } = this.props;
        let {width, showIgnored} = this.state;

        if (passwordAccount && !myActiveAccounts.has(passwordAccount)) {
            myActiveAccounts = myActiveAccounts.add(passwordAccount);
        }
        let names = myActiveAccounts.toArray().sort();
        if (passwordAccount && names.indexOf(passwordAccount) === -1)
            names.push(passwordAccount);
        let ignored = myHiddenAccounts.toArray().sort();

        let accountCount =
            myActiveAccounts.size +
            myHiddenAccounts.size +
            (passwordAccount ? 1 : 0);

        if (!accountsReady) {
            return <LoadingIndicator />;
        }

        if (!accountCount) {
            return <LoginSelector />;
        }

        const contacts = this.props.contacts.toArray();
        return (
            <div ref="wrapper" className="grid-block page-layout vertical">
                <div
                    ref="container"
                    className="tabs-container generic-bordered-box"
                >
                    <Tabs
                        setting="accountTab"
                        className="account-tabs"
                        defaultActiveTab={1}
                        segmented={false}
                        tabsClass="account-overview no-padding bordered-header content-block"
                    >
                        <Tab title="account.accounts">
                            <div className="generic-bordered-box">
                                <div className="box-content">
                                    <DashboardList
                                        accounts={Immutable.List(names)}
                                        ignoredAccounts={Immutable.List(
                                            ignored
                                        )}
                                        width={width}
                                        onToggleIgnored={this._onToggleIgnored.bind(
                                            this
                                        )}
                                        showIgnored={showIgnored}
                                        showMyAccounts={true}
                                    />
                                </div>
                            </div>
                        </Tab>
                        <Tab title="account.contacts">
                            <div className="generic-bordered-box">
                                <div className="box-content">
                                    <DashboardList
                                        accounts={contacts}
                                        passwordAccount={passwordAccount}
                                        ignoredAccounts={Immutable.List(
                                            ignored
                                        )}
                                        width={width}
                                        onToggleIgnored={this._onToggleIgnored.bind(
                                            this
                                        )}
                                        showIgnored={showIgnored}
                                        isContactsList={true}
                                    />
                                </div>
                            </div>
                        </Tab>
                        <Tab title="account.recent">
                            <RecentTransactions
                                accountsList={myActiveAccounts}
                                limit={10}
                                compactView={false}
                                fullHeight={true}
                                showFilters={true}
                                dashboard
                            />
                        </Tab>
                    </Tabs>
                </div>
            </div>
        );
    }
}

const DashboardAccountsOnly = props => {
    return <AccountsContainer {...props} onlyAccounts />;
};

export default DashboardAccountsOnly;
