import React from "react";

import { Tabs, Tab } from "../Utility/Tabs";
import { StarredMarkets, TopMarkets, FeaturedMarkets } from "./Markets";

class DashboardPage extends React.Component {
    render() {
        return (
            <div className="grid-block page-layout">
                <div className="grid-block no-padding">
                    <div className="grid-content app-tables no-padding" ref="appTables">
                        <div className="content-block small-12">
                            <div className="tabs-container generic-bordered-box">
                                <Tabs defaultActiveTab={1} segmented={false} setting="dashboardTab" className="account-tabs" tabsClass="account-overview no-padding bordered-header content-block">
                                    <Tab title="dashboard.starred_markets">
                                        <StarredMarkets />
                                    </Tab>
                                    <Tab title="dashboard.featured_markets">
                                        <FeaturedMarkets />
                                    </Tab>
                                    {/* <Tab title="dashboard.top_markets">
                                        <TopMarkets />
                                    </Tab> */}
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default DashboardPage;
