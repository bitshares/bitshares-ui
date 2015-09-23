import React from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import Operation from "../Blockchain/Operation";
import LoadingIndicator from "../LoadingIndicator";
import BalanceComponent from "../Utility/BalanceComponent";
import CollateralPosition from "../Blockchain/CollateralPosition";
import RecentTransactions from "./RecentTransactions";

class AccountOverview extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired
    }

    shouldComponentUpdate(nextProps) {
        return true;
    }

    render() {
        let account = this.props.account;
        let call_orders = account.get("call_orders") ? account.get("call_orders").toJS() : [];
        let balances = {};
        let account_balances = account.get("balances");
        if (account_balances) {
            account_balances.forEach( balance => {
                balances[balance] = (
                    <tr key={balance}>
                        <td><BalanceComponent balance={balance}/></td>
                    </tr>
                );
            })
        }
        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3><Translate content="transfer.balances" /></h3>
                    <table className="table">
                        {/*<thead>
                            <tr>
                                <th><Translate component="span" content="account.asset" /></th>
                            </tr>
                        </thead>*/}
                        <tbody>
                            {React.addons.createFragment(balances)}
                        </tbody>
                    </table>
                </div>
                {call_orders.length > 0 ? <div className="content-block">
                    <h3>Collateral Positions</h3>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Debt</th>
                            <th>Collateral</th>
                            <th>Call Price</th>
                            <th>Update position</th>
                        </tr>
                        </thead>
                        <tbody>
                        { call_orders.map(id =><CollateralPosition object={id} account={account}/>) }
                        </tbody>
                    </table>
                </div> : null}
                <div className="content-block">
                    <h3><Translate content="account.recent" /></h3>
                    <RecentTransactions accountsList={Immutable.fromJS([account.get("id")])} limit={1000} compactView={false}/>
                </div>
            </div>

        );
    }
}

export default AccountOverview;
