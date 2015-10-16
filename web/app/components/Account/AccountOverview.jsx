import React from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import Operation from "../Blockchain/Operation";
import LoadingIndicator from "../LoadingIndicator";
import BalanceComponent from "../Utility/BalanceComponent";
import MarketLink from "../Utility/MarketLink";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import CollateralPosition from "../Blockchain/CollateralPosition";
import RecentTransactions from "./RecentTransactions";

class AccountOverview extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired
    }

    render() {
        let account = this.props.account;
        if (!account) {
            return null;
        }
        let call_orders = [];
        if (account.toJS && account.has("call_orders")) call_orders = account.get("call_orders").toJS();
        let balances = {};
        let account_balances = account.get("balances");
        let balanceList = Immutable.List();

        if (account_balances) {
            account_balances.forEach( balance => {
                balanceList = balanceList.push(balance);
                balances[balance] = (
                    <tr key={balance}>
                        <td><BalanceComponent balance={balance}/></td>
                        <td><BalanceValueComponent balance={balance}/></td>
                        <td>{balance !== "1.3.0" ? <MarketLink.ObjectWrapper object={balance}></MarketLink.ObjectWrapper> : null}</td>
                    </tr>
                );
            })
        }

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3><Translate content="transfer.balances" /></h3>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Translate component="span" content="account.asset" /></th>
                                    <th><Translate component="span" content="account.eq_value" /></th>
                                    <th><Translate component="span" content="account.bts_market" /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {React.addons.createFragment(balances)}
                            </tbody>
                        </table>
                </div>
                {call_orders.length > 0 ? <div className="content-block">
                    <h3><Translate content="account.collaterals" /></h3>
                    <table className="table">
                        <thead>
                        <tr>
                            <th><Translate content="transaction.borrow_amount" /></th>
                            <th><Translate content="transaction.collateral" /></th>
                            <th><Translate content="exchange.call" /></th>
                            <th><Translate content="borrow.adjust" /></th>
                            <th><Translate content="borrow.close" /></th>
                        </tr>
                        </thead>
                        <tbody>
                        { call_orders.map(id =><CollateralPosition object={id} account={account}/>) }
                        </tbody>
                    </table>
                </div> : null}
                <div className="content-block">
                    <h3><Translate content="account.recent" /></h3>
                    <RecentTransactions
                        accountsList={Immutable.fromJS([account.get("id")])}
                        compactView={false}
                        showMore={true}
                    />
                </div>
            </div>

        );
    }
}

export default AccountOverview;
