import React from "react";
import {connect} from "alt-react";

import LoadingIndicator from "../LoadingIndicator";
import LoginSelector from "../LoginSelector";
import AccountStore from "stores/AccountStore";

import {Tabs, Tab} from "../Utility/Tabs";
import {StarredMarkets, TopMarkets, FeaturedMarkets} from "./Markets";
import BitSharesGridLayout from "../Utility/BitSharesGridLayout";

class DashboardPage extends React.Component {
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
                                    <Tab title="dashboard.featured_markets">
                                        <FeaturedMarkets />
                                    </Tab>
                                    <Tab title="ReactGridLayoutTest">
                                        <BitSharesGridLayout
                                            rowHeight={100}
                                            width="100%"
                                            layoutid="unique_for_ls"
                                        >
                                            <div
                                                key="a"
                                                dragname="Draggable Area Starred Markets"
                                                layout={{
                                                    lg: {x: 0, y: 0, w: 1, h: 5}
                                                }}
                                            >
                                                <StarredMarkets />
                                            </div>
                                            <div
                                                key="b"
                                                dragname="Draggable Area B"
                                                layout={{
                                                    lg: {x: 1, y: 0, w: 1, h: 1}
                                                }}
                                            >
                                                <span className="text">
                                                    Area B
                                                </span>
                                            </div>
                                            <div
                                                key="c"
                                                dragname="Draggable Area C"
                                                layout={{
                                                    lg: {x: 2, y: 0, w: 1, h: 1}
                                                }}
                                            >
                                                <span className="text">
                                                    Area C
                                                </span>
                                            </div>
                                            <div
                                                key="d"
                                                dragname="Draggable Area D"
                                                layout={{
                                                    lg: {x: 1, y: 1, w: 1, h: 1}
                                                }}
                                            >
                                                <span className="text">
                                                    Area D
                                                </span>
                                            </div>
                                        </BitSharesGridLayout>
                                    </Tab>
                                </Tabs>
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
