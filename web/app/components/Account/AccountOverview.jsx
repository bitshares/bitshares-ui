import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import Operation from "../Blockchain/Operation";
import LoadingIndicator from "../LoadingIndicator";
import BalanceComponent from "../Utility/BalanceComponent";
import CollateralPosition from "../Blockchain/CollateralPosition";

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
        if(account_balances) {
            account_balances.forEach( balance => {
                balances[balance] = (
                    <tr key={balance}>
                        <td><BalanceComponent balance={balance}/></td>
                    </tr>
                );
            })
        }
        let history = {};
        let account_history = account.get("history");
        if(account_history) {
            account_history.take(100).forEach( t => {
                let trx = t.toJS();
                history[trx.id] = (
                    <Operation
                        key={trx.id}
                        op={trx.op}
                        result={trx.result}
                        block={trx.block_num}
                        current={account.get("id")}
                        inverted={this.props.settings.get("inverseMarket")}
                        hideFee={false}
                        />
                );
            });
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
                        </tr>
                        </thead>
                        <tbody>
                        { call_orders.map(id =><CollateralPosition object={id}/>) }
                        </tbody>
                    </table>
                </div> : null}
                <div className="content-block">
                <h3><Translate content="account.recent" /></h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th><Translate content="explorer.block.date" /></th>
                                <th><Translate content="explorer.block.op" /></th>
                                <th><Translate content="account.votes.info" /></th>
                            </tr>
                        </thead>
                        <tbody>
                        {React.addons.createFragment(history)}
                        </tbody>
                    </table>
                </div>
            </div>

        );
    }
}

export default AccountOverview;
