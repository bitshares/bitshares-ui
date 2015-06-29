import React from "react";
import {PropTypes} from "react";
import {FormattedNumber} from "react-intl";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";

class AccountOverview extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.account_name !== this.props.account_name ||
            nextProps.browseAccounts !== this.props.browseAccounts ||
            nextProps.assets !== this.props.assets ||
            nextProps.accountBalances !== this.props.accountBalances
        );
    }

    render() {
        let {account_name, browseAccounts, account_name_to_id, assets, accountBalances} = this.props;
        let account_id = account_name_to_id[account_name]
        let account = account_id ? browseAccounts.get(account_id) : null;
        if(!account) return <div>Account {account_name} couldn't be displayed</div>;
        let balances = accountBalances.get(account.id).map( balance => {
            balance.amount = parseFloat(balance.amount);
            return (
                <tr key={balance.asset_id}>
                    <td><FormattedAsset amount={balance.amount} asset={assets.get(balance.asset_id)}/></td>
                    <td><FormattedAsset amount={balance.amount} asset={assets.get(balance.asset_id)}/></td>
                    <td><FormattedNumber style="percent" value={0.1 * Math.random()}/></td>
                </tr>
            );
        });
        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Assets</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th><Translate component="span" content="account.asset" /></th>
                                <th><Translate component="span" content="account.market_value" /></th>
                                <th><Translate component="span" content="account.hour_24" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {balances}
                        </tbody>
                    </table>
                </div>
                <div className="content-block">
                    <h3>Proposed Transactions</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Operation</th>
                                <th>Description</th>
                                <th>Expiration</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Withdraw</td>
                                <td>Withdraw 10.0 CORE from account Alice</td>
                                <td>01/01/2016</td>
                            </tr>
                            <tr>
                                <td>Deposit</td>
                                <td>Deposit 10.0 CORE to account Bob</td>
                                <td>01/01/2016</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="actions clearfix">
                        <div className="float-right">
                            <a href="#" className="button outline">Reject</a>
                            <a href="#" className="button outline">Approve</a>
                        </div>
                    </div>
                </div>
                <div className="content-block">
                    <h3>Recent Transactions</h3>
                    <table className="table text-left" data-reactid=".0.3.1.0.0"><tbody data-reactid=".0.3.1.0.0.0"><tr data-reactid=".0.3.1.0.0.0.$0"><td data-reactid=".0.3.1.0.0.0.$0.0"><a class="" href="#/block/8205" data-reactid=".0.3.1.0.0.0.$0.0.0"><span data-reactid=".0.3.1.0.0.0.$0.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$0.0.0.1">8205</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$0.1"><span class="label success" data-reactid=".0.3.1.0.0.0.$0.1.0">Transfer</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$0.2"><span data-reactid=".0.3.1.0.0.0.$0.2.0">Sent</span><span data-reactid=".0.3.1.0.0.0.$0.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$0.2.2"><span data-reactid=".0.3.1.0.0.0.$0.2.2.0">111.000</span><span data-reactid=".0.3.1.0.0.0.$0.2.2.1"> </span><span data-reactid=".0.3.1.0.0.0.$0.2.2.2">CORE</span></span><span data-reactid=".0.3.1.0.0.0.$0.2.3">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$0.2.4">to</span><span data-reactid=".0.3.1.0.0.0.$0.2.5"> </span><a class="" href="#/account/init2" data-reactid=".0.3.1.0.0.0.$0.2.6">init2</a></td><td data-reactid=".0.3.1.0.0.0.$0.3"><span data-reactid=".0.3.1.0.0.0.$0.3.0"><span data-reactid=".0.3.1.0.0.0.$0.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$0.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$0.3.0.2">CORE</span></span></td></tr><tr data-reactid=".0.3.1.0.0.0.$1"><td data-reactid=".0.3.1.0.0.0.$1.0"><a class="" href="#/block/8205" data-reactid=".0.3.1.0.0.0.$1.0.0"><span data-reactid=".0.3.1.0.0.0.$1.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$1.0.0.1">8205</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$1.1"><span class="label success" data-reactid=".0.3.1.0.0.0.$1.1.0">Transfer</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$1.2"><span data-reactid=".0.3.1.0.0.0.$1.2.0">Sent</span><span data-reactid=".0.3.1.0.0.0.$1.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$1.2.2"><span data-reactid=".0.3.1.0.0.0.$1.2.2.0">111.000</span><span data-reactid=".0.3.1.0.0.0.$1.2.2.1"> </span><span data-reactid=".0.3.1.0.0.0.$1.2.2.2">CORE</span></span><span data-reactid=".0.3.1.0.0.0.$1.2.3">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$1.2.4">to</span><span data-reactid=".0.3.1.0.0.0.$1.2.5"> </span><a class="" href="#/account/init2" data-reactid=".0.3.1.0.0.0.$1.2.6">init2</a></td><td data-reactid=".0.3.1.0.0.0.$1.3"><span data-reactid=".0.3.1.0.0.0.$1.3.0"><span data-reactid=".0.3.1.0.0.0.$1.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$1.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$1.3.0.2">CORE</span></span></td></tr><tr data-reactid=".0.3.1.0.0.0.$2"><td data-reactid=".0.3.1.0.0.0.$2.0"><a class="" href="#/block/8205" data-reactid=".0.3.1.0.0.0.$2.0.0"><span data-reactid=".0.3.1.0.0.0.$2.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$2.0.0.1">8205</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$2.1"><span class="label success" data-reactid=".0.3.1.0.0.0.$2.1.0">Transfer</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$2.2"><span data-reactid=".0.3.1.0.0.0.$2.2.0">Sent</span><span data-reactid=".0.3.1.0.0.0.$2.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$2.2.2"><span data-reactid=".0.3.1.0.0.0.$2.2.2.0">111.000</span><span data-reactid=".0.3.1.0.0.0.$2.2.2.1"> </span><span data-reactid=".0.3.1.0.0.0.$2.2.2.2">CORE</span></span><span data-reactid=".0.3.1.0.0.0.$2.2.3">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$2.2.4">to</span><span data-reactid=".0.3.1.0.0.0.$2.2.5"> </span><a class="" href="#/account/init2" data-reactid=".0.3.1.0.0.0.$2.2.6">init2</a></td><td data-reactid=".0.3.1.0.0.0.$2.3"><span data-reactid=".0.3.1.0.0.0.$2.3.0"><span data-reactid=".0.3.1.0.0.0.$2.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$2.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$2.3.0.2">CORE</span></span></td></tr><tr data-reactid=".0.3.1.0.0.0.$3"><td data-reactid=".0.3.1.0.0.0.$3.0"><a class="" href="#/block/8184" data-reactid=".0.3.1.0.0.0.$3.0.0"><span data-reactid=".0.3.1.0.0.0.$3.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$3.0.0.1">8184</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$3.1"><span class="label success" data-reactid=".0.3.1.0.0.0.$3.1.0">Transfer</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$3.2"><span data-reactid=".0.3.1.0.0.0.$3.2.0">Sent</span><span data-reactid=".0.3.1.0.0.0.$3.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$3.2.2"><span data-reactid=".0.3.1.0.0.0.$3.2.2.0">3.000</span><span data-reactid=".0.3.1.0.0.0.$3.2.2.1"> </span><span data-reactid=".0.3.1.0.0.0.$3.2.2.2">CORE</span></span><span data-reactid=".0.3.1.0.0.0.$3.2.3">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$3.2.4">to</span><span data-reactid=".0.3.1.0.0.0.$3.2.5"> </span><a class="" href="#/account/committee-account" data-reactid=".0.3.1.0.0.0.$3.2.6">committee-account</a></td><td data-reactid=".0.3.1.0.0.0.$3.3"><span data-reactid=".0.3.1.0.0.0.$3.3.0"><span data-reactid=".0.3.1.0.0.0.$3.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$3.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$3.3.0.2">CORE</span></span></td></tr><tr data-reactid=".0.3.1.0.0.0.$4"><td data-reactid=".0.3.1.0.0.0.$4.0"><a class="" href="#/block/8112" data-reactid=".0.3.1.0.0.0.$4.0.0"><span data-reactid=".0.3.1.0.0.0.$4.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$4.0.0.1">8112</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$4.1"><span class="label success" data-reactid=".0.3.1.0.0.0.$4.1.0">Transfer</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$4.2"><span data-reactid=".0.3.1.0.0.0.$4.2.0">Sent</span><span data-reactid=".0.3.1.0.0.0.$4.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$4.2.2"><span data-reactid=".0.3.1.0.0.0.$4.2.2.0">1.000</span><span data-reactid=".0.3.1.0.0.0.$4.2.2.1"> </span><span data-reactid=".0.3.1.0.0.0.$4.2.2.2">CORE</span></span><span data-reactid=".0.3.1.0.0.0.$4.2.3">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$4.2.4">to</span><span data-reactid=".0.3.1.0.0.0.$4.2.5"> </span><a class="" href="#/account/init0" data-reactid=".0.3.1.0.0.0.$4.2.6">init0</a></td><td data-reactid=".0.3.1.0.0.0.$4.3"><span data-reactid=".0.3.1.0.0.0.$4.3.0"><span data-reactid=".0.3.1.0.0.0.$4.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$4.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$4.3.0.2">CORE</span></span></td></tr><tr data-reactid=".0.3.1.0.0.0.$5"><td data-reactid=".0.3.1.0.0.0.$5.0"><a class="" href="#/block/3553" data-reactid=".0.3.1.0.0.0.$5.0.0"><span data-reactid=".0.3.1.0.0.0.$5.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$5.0.0.1">3553</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$5.1"><span class="label warning" data-reactid=".0.3.1.0.0.0.$5.1.0">Limit order</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$5.2"><span data-reactid=".0.3.1.0.0.0.$5.2.0">Placed limit order to buy</span><span data-reactid=".0.3.1.0.0.0.$5.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$5.2.2"><span data-reactid=".0.3.1.0.0.0.$5.2.2.0">5.00</span><span data-reactid=".0.3.1.0.0.0.$5.2.2.1"> </span><span data-reactid=".0.3.1.0.0.0.$5.2.2.2">TEST</span></span><span data-reactid=".0.3.1.0.0.0.$5.2.3">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$5.2.4">at</span><span data-reactid=".0.3.1.0.0.0.$5.2.5">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$5.2.6"><span data-reactid=".0.3.1.0.0.0.$5.2.6.0">160.0</span><span data-reactid=".0.3.1.0.0.0.$5.2.6.1"> </span><span data-reactid=".0.3.1.0.0.0.$5.2.6.2">CORE/TEST</span></span></td><td data-reactid=".0.3.1.0.0.0.$5.3"><span data-reactid=".0.3.1.0.0.0.$5.3.0"><span data-reactid=".0.3.1.0.0.0.$5.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$5.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$5.3.0.2">CORE</span></span></td></tr><tr data-reactid=".0.3.1.0.0.0.$6"><td data-reactid=".0.3.1.0.0.0.$6.0"><a class="" href="#/block/3319" data-reactid=".0.3.1.0.0.0.$6.0.0"><span data-reactid=".0.3.1.0.0.0.$6.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$6.0.0.1">3319</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$6.1"><span class="label cancel" data-reactid=".0.3.1.0.0.0.$6.1.0">Cancel limit order</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$6.2"><span data-reactid=".0.3.1.0.0.0.$6.2.0">Cancelled limit order with id</span><span data-reactid=".0.3.1.0.0.0.$6.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$6.2.2">1.8.0</span></td><td data-reactid=".0.3.1.0.0.0.$6.3"><span data-reactid=".0.3.1.0.0.0.$6.3.0"><span data-reactid=".0.3.1.0.0.0.$6.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$6.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$6.3.0.2">CORE</span></span></td></tr><tr data-reactid=".0.3.1.0.0.0.$7"><td data-reactid=".0.3.1.0.0.0.$7.0"><a class="" href="#/block/3319" data-reactid=".0.3.1.0.0.0.$7.0.0"><span data-reactid=".0.3.1.0.0.0.$7.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$7.0.0.1">3319</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$7.1"><span class="label cancel" data-reactid=".0.3.1.0.0.0.$7.1.0">Cancel limit order</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$7.2"><span data-reactid=".0.3.1.0.0.0.$7.2.0">Cancelled limit order with id</span><span data-reactid=".0.3.1.0.0.0.$7.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$7.2.2">1.8.1</span></td><td data-reactid=".0.3.1.0.0.0.$7.3"><span data-reactid=".0.3.1.0.0.0.$7.3.0"><span data-reactid=".0.3.1.0.0.0.$7.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$7.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$7.3.0.2">CORE</span></span></td></tr><tr data-reactid=".0.3.1.0.0.0.$8"><td data-reactid=".0.3.1.0.0.0.$8.0"><a class="" href="#/block/3311" data-reactid=".0.3.1.0.0.0.$8.0.0"><span data-reactid=".0.3.1.0.0.0.$8.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$8.0.0.1">3311</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$8.1"><span class="label warning" data-reactid=".0.3.1.0.0.0.$8.1.0">Limit order</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$8.2"><span data-reactid=".0.3.1.0.0.0.$8.2.0">Placed limit order to buy</span><span data-reactid=".0.3.1.0.0.0.$8.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$8.2.2"><span data-reactid=".0.3.1.0.0.0.$8.2.2.0">5.00</span><span data-reactid=".0.3.1.0.0.0.$8.2.2.1"> </span><span data-reactid=".0.3.1.0.0.0.$8.2.2.2">TEST</span></span><span data-reactid=".0.3.1.0.0.0.$8.2.3">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$8.2.4">at</span><span data-reactid=".0.3.1.0.0.0.$8.2.5">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$8.2.6"><span data-reactid=".0.3.1.0.0.0.$8.2.6.0">160.0</span><span data-reactid=".0.3.1.0.0.0.$8.2.6.1"> </span><span data-reactid=".0.3.1.0.0.0.$8.2.6.2">CORE/TEST</span></span></td><td data-reactid=".0.3.1.0.0.0.$8.3"><span data-reactid=".0.3.1.0.0.0.$8.3.0"><span data-reactid=".0.3.1.0.0.0.$8.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$8.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$8.3.0.2">CORE</span></span></td></tr><tr data-reactid=".0.3.1.0.0.0.$9"><td data-reactid=".0.3.1.0.0.0.$9.0"><a class="" href="#/block/3309" data-reactid=".0.3.1.0.0.0.$9.0.0"><span data-reactid=".0.3.1.0.0.0.$9.0.0.0">#</span><span data-reactid=".0.3.1.0.0.0.$9.0.0.1">3309</span></a></td><td class="left-td" data-reactid=".0.3.1.0.0.0.$9.1"><span class="label warning" data-reactid=".0.3.1.0.0.0.$9.1.0">Limit order</span></td><td class="right-td" data-reactid=".0.3.1.0.0.0.$9.2"><span data-reactid=".0.3.1.0.0.0.$9.2.0">Placed limit order to buy</span><span data-reactid=".0.3.1.0.0.0.$9.2.1">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$9.2.2"><span data-reactid=".0.3.1.0.0.0.$9.2.2.0">5.00</span><span data-reactid=".0.3.1.0.0.0.$9.2.2.1"> </span><span data-reactid=".0.3.1.0.0.0.$9.2.2.2">TEST</span></span><span data-reactid=".0.3.1.0.0.0.$9.2.3">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$9.2.4">at</span><span data-reactid=".0.3.1.0.0.0.$9.2.5">&nbsp;</span><span data-reactid=".0.3.1.0.0.0.$9.2.6"><span data-reactid=".0.3.1.0.0.0.$9.2.6.0">160.0</span><span data-reactid=".0.3.1.0.0.0.$9.2.6.1"> </span><span data-reactid=".0.3.1.0.0.0.$9.2.6.2">CORE/TEST</span></span></td><td data-reactid=".0.3.1.0.0.0.$9.3"><span data-reactid=".0.3.1.0.0.0.$9.3.0"><span data-reactid=".0.3.1.0.0.0.$9.3.0.0">0.000</span><span data-reactid=".0.3.1.0.0.0.$9.3.0.1"> </span><span data-reactid=".0.3.1.0.0.0.$9.3.0.2">CORE</span></span></td></tr></tbody></table>
                </div>
            </div>

        );
    }
}

export default AccountOverview;
