import React from "react";
import {connect} from "alt-react";
import counterpart from "counterpart";
import {Tabs, Tab} from "../../Utility/Tabs";
import erList from "./CreditOfferList";
import CreditDebtList from "./CreditDebtList";
import CreditRightsList from "./CreditRightsList";

class CreditOfferAccountPage extends React.Component {
    render() {
        return (
            <Tabs
                defaultActiveTab={0}
                className="account-tabs"
                tabsClass="account-overview no-padding bordered-header content-block"
            >
                <Tab
                    title={counterpart.translate("credit_offer.credit_offers")}
                >
                    <CreditOfferList account={this.props.account} />
                </Tab>
                <Tab
                    title={counterpart.translate("credit_offer.credit_rights")}
                >
                    <CreditRightsList account={this.props.account} />
                </Tab>
                <Tab title={counterpart.translate("credit_offer.credit_debts")}>
                    <CreditDebtList account={this.props.account} />
                </Tab>
            </Tabs>
        );
    }
}

CreditOfferAccountPage = connect(CreditOfferAccountPage, {});

export default CreditOfferAccountPage;
