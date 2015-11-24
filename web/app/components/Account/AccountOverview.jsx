import React from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import Operation from "../Blockchain/Operation";
import LoadingIndicator from "../LoadingIndicator";
import BalanceComponent from "../Utility/BalanceComponent";
import TotalBalanceValue from "../Utility/TotalBalanceValue";

import MarketLink from "../Utility/MarketLink";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import CollateralPosition from "../Blockchain/CollateralPosition";
import RecentTransactions from "./RecentTransactions";
import ChainStore from "api/ChainStore";

class AccountOverview extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired
    }

    render() {
        let {account, settings} = this.props;
        if (!account) {
            return null;
        }
        let call_orders = [];
        if (account.toJS && account.has("call_orders")) call_orders = account.get("call_orders").toJS();
        let balances = {};
        let account_balances = account.get("balances");
        let balanceList = Immutable.List();

        let preferredUnit = settings.get("unit") || "1.3.0";
        if (account_balances) {
            account_balances.forEach( balance => {
                let balanceAmount = ChainStore.getObject(balance);
                if (!balanceAmount.get("balance")) {
                    return null;
                }
                balanceList = balanceList.push(balance);
                balances[balance] = (
                    <tr key={balance} style={{maxWidth: "100rem"}}>
                        <td><BalanceComponent balance={balance}/></td>
                        <td><MarketLink.ObjectWrapper object={balance}></MarketLink.ObjectWrapper></td>
                        <td style={{textAlign: "right"}}><BalanceValueComponent balance={balance} toAsset={preferredUnit}/></td>
                        <td style={{textAlign: "right"}}><BalanceComponent balance={balance} asPercentage={true}/></td>
                    </tr>
                );
            })
        }

        let totalBalance = balanceList.size ? <TotalBalanceValue balances={balanceList}/> : null;

        return (
            <div className="grid-content">
                <div className="content-block small-12 medium-10 large-8">
                    <h3><Translate content="transfer.balances" /></h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th><Translate component="span" content="account.asset" /></th>
                                <th><Translate component="span" content="account.bts_market" /></th>
                                <th style={{textAlign: "right"}}><Translate component="span" content="account.eq_value" /></th>
                                <th style={{textAlign: "right"}}><Translate component="span" content="account.percent" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {React.addons.createFragment(balances)}
                            {balanceList.size ? <tr><td></td><td></td><td style={{textAlign: "right"}}>{totalBalance}</td><td></td></tr> : null}
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
