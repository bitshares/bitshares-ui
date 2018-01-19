import React from "react";
import Immutable from "immutable";
import DashboardList from "./DashboardList";
import { RecentTransactions } from "../Account/RecentTransactions";
import Translate from "react-translate-component";
import MarketCard from "./MarketCard";
import utils from "common/utils";
import { Apis } from "bitsharesjs-ws";
import LoadingIndicator from "../LoadingIndicator";
import LoginSelector from "../LoginSelector";
import cnames from "classnames";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import { connect } from "alt-react";
import AccountStore from "stores/AccountStore";
import MarketsStore from "stores/MarketsStore";

import AltContainer from "alt-container";

class AccountsContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AccountStore, SettingsStore, MarketsStore]}
                inject={{
                    linkedAccounts: () => {
                        return AccountStore.getState().linkedAccounts;
                    },
                    myIgnoredAccounts: () => {
                        return AccountStore.getState().myIgnoredAccounts;
                    },
                    accountsReady: () => {
                        return AccountStore.getState().accountsLoaded && AccountStore.getState().refsLoaded;
                    },
                    passwordAccount: () => {
                        return AccountStore.getState().passwordAccount;
                    },
                    lowVolumeMarkets: () => {
                        return MarketsStore.getState().lowVolumeMarkets;
                    },
                    currentEntry: SettingsStore.getState().viewSettings.get("dashboardEntry", "accounts")
                }}>
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

        window.addEventListener("resize", this._setDimensions, {capture: false, passive: true});
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
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
        let { linkedAccounts, myIgnoredAccounts, accountsReady, passwordAccount } = this.props;
        let {width, showIgnored, featuredMarkets, newAssets, currentEntry} = this.state;

        if (passwordAccount && !linkedAccounts.has(passwordAccount)) {
            linkedAccounts = linkedAccounts.add(passwordAccount);
        }
        let names = linkedAccounts.toArray().sort();
        if (passwordAccount && names.indexOf(passwordAccount) === -1) names.push(passwordAccount);
        let ignored = myIgnoredAccounts.toArray().sort();

        let accountCount = linkedAccounts.size + myIgnoredAccounts.size + (passwordAccount ? 1 : 0);

        if (!accountsReady) {
            return <LoadingIndicator />;
        }

        if (!accountCount) {
            return <LoginSelector />;
        }

        const entries = ["accounts", "contacts", "recent"];
        const activeIndex = entries.indexOf(currentEntry);

        return (
            <div ref="wrapper" className="grid-block page-layout vertical">
                <div ref="container" className="grid-container" style={{padding: "2rem 8px"}}>
                    {accountCount ? (
                        <div style={{paddingBottom: "3rem"}}>
                            <div className="hide-selector" style={{paddingBottom: "1rem"}}>
                                {entries.map((type, index) => {
                                    return (
                                        <div key={type} className={cnames("inline-block", {inactive: activeIndex !== index})} onClick={this._onSwitchType.bind(this, type)}>
                                            <Translate content={`account.${type}`} />
                                        </div>
                                    );
                                })}
                            </div>

                            {(currentEntry === "accounts" || currentEntry === "contacts") ? <div className="generic-bordered-box" style={{marginBottom: 5}}>
                                <div className="box-content">
                                    <DashboardList
                                        accounts={Immutable.List(names)}
                                        ignoredAccounts={Immutable.List(ignored)}
                                        width={width}
                                        onToggleIgnored={this._onToggleIgnored.bind(this)}
                                        showIgnored={showIgnored}
                                        showMyAccounts={currentEntry === "accounts"}
                                    />
                                    {/* {showIgnored ? <DashboardList accounts={Immutable.List(ignored)} width={width} /> : null} */}
                                </div>
                            </div> : null}

                            {currentEntry === "recent" ? <RecentTransactions
                                style={{marginBottom: 20, marginTop: 20}}
                                accountsList={linkedAccounts}
                                limit={10}
                                compactView={false}
                                fullHeight={true}
                                showFilters={true}
                                dashboard
                            /> : null}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }
}

const DashboardAccountsOnly = (props) => {
    return <AccountsContainer {...props} onlyAccounts />;
};

export default DashboardAccountsOnly;
