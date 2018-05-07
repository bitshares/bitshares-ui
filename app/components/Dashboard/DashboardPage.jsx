import React from "react";
import {connect} from "alt-react";

import LoadingIndicator from "../LoadingIndicator";
import LoginSelector from "../LoginSelector";
import AccountStore from "stores/AccountStore";
import CryptoBridgeActions from "actions/CryptoBridgeActions";

import {Tabs, Tab} from "../Utility/Tabs";

import {StarredMarkets, CryptoBridgeMarkets} from "./Markets";
import CryptoBridgeNews from "./CryptoBridgeNews";

import Translate from "react-translate-component";

class DashboardPage extends React.Component {
    componentWillMount() {
        CryptoBridgeActions.getNews.defer();
    }

    render() {
        let {
            myActiveAccounts,
            myHiddenAccounts,
            accountsReady,
            passwordAccount
        } = this.props;
        if (!accountsReady) {
            return <LoadingIndicator />;
        }

        let accountCount =
            myActiveAccounts.size +
            myHiddenAccounts.size +
            (passwordAccount ? 1 : 0);
        if (!accountCount) {
            return <LoginSelector />;
        }

        return (
            <div>
                <div className="padding">
                    <h3>
                        <Translate content="cryptobridge.general.news" />
                    </h3>
                    <CryptoBridgeNews />
                </div>
                <div className="grid-block page-layout">
                    <div className="grid-block no-padding">
                        <div
                            className="grid-content app-tables no-padding"
                            ref="appTables"
                        >
                            <div className="content-block small-12">
                                <div className="tabs-container generic-bordered-box">
                                    <Tabs
                                        defaultActiveTab={0}
                                        segmented={false}
                                        setting="dashboardTab"
                                        className="account-tabs"
                                        tabsClass="account-overview no-padding bordered-header content-block"
                                    >
                                        <Tab title="dashboard.featured_markets">
                                            <CryptoBridgeMarkets
                                                featured={true}
                                            />
                                        </Tab>
                                        <Tab title="dashboard.starred_markets">
                                            <StarredMarkets />
                                        </Tab>
                                        <Tab title="cryptobridge.dashboard.all_markets">
                                            <CryptoBridgeMarkets />
                                        </Tab>
                                    </Tabs>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(DashboardPage, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        let {
            myActiveAccounts,
            myHiddenAccounts,
            passwordAccount,
            accountsLoaded,
            refsLoaded
        } = AccountStore.getState();

        return {
            myActiveAccounts,
            myHiddenAccounts,
            passwordAccount,
            accountsReady: accountsLoaded && refsLoaded
        };
    }
});
