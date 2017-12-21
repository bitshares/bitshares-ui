import React from "react";
import DashboardContainer from "./DashboardContainer";

const DashboardAccountsOnly = (props) => {
    return <DashboardContainer {...props} onlyAccounts />;
};

export default DashboardAccountsOnly;
