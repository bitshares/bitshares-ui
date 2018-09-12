import React from "react";
import {connect} from "alt-react";

import LoadingIndicator from "../LoadingIndicator";
import LoginSelector from "../LoginSelector";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";

import {Tabs, Tab} from "../Utility/Tabs";
import {StarredMarkets, FeaturedMarkets} from "./Markets";
import {getPossibleGatewayPrefixes} from "common/gateways";

class DashboardPage extends React.Component {
    render() {
        let {
            myActiveAccounts,
            myHiddenAccounts,
            accountsReady,
            passwordAccount,
            preferredBases
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
            <div className="grid-block page-layout">
                <div className="grid-block no-padding">
                    <div
                        className="grid-content app-tables no-padding"
                        ref="appTables"
                    >
                        <div className="content-block small-12">
                            <div className="tabs-container generic-bordered-box">
                                <Tabs
                                    defaultActiveTab={1}
                                    segmented={false}
                                    setting="dashboardTab"
                                    className="account-tabs"
                                    tabsClass="account-overview no-padding bordered-header content-block"
                                >
                                    <Tab title="dashboard.starred_markets">
                                        <StarredMarkets />
                                    </Tab>
                                    {preferredBases.sort().map(q => {
                                        let title = (
                                            <span>
                                                <img
                                                    className="column-hide-small"
                                                    style={{
                                                        maxWidth: 30,
                                                        marginRight: 5
                                                    }}
                                                    src={`${__BASE_URL__}asset-symbols/${q
                                                        .replace(
                                                            /^BTC/,
                                                            "OPEN.BTC"
                                                        )
                                                        .toLowerCase()}.png`}
                                                />
                                                &nbsp;
                                                {q}
                                            </span>
                                        );

                                        return (
                                            <Tab key={q} title={title}>
                                                <FeaturedMarkets
                                                    quotes={[q].concat(
                                                        getPossibleGatewayPrefixes(
                                                            [q]
                                                        )
                                                    )}
                                                />
                                            </Tab>
                                        );
                                    })}
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(
    DashboardPage,
    {
        listenTo() {
            return [AccountStore, SettingsStore];
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
                accountsReady: accountsLoaded && refsLoaded,
                preferredBases: SettingsStore.getState().preferredBases
            };
        }
    }
);
