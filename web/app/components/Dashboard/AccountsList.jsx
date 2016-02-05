import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react-router";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import connectToStores from "alt/utils/connectToStores";
import SettingsStore from "stores/SettingsStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import SettingsActions from "actions/SettingsActions";
import AssetActions from "actions/AssetActions";
import MarketsActions from "actions/MarketsActions";
import cnames from "classnames";
import Icon from "../Icon/Icon";
import { ChainStore } from "@graphene/chain";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import AccountStore from "stores/AccountStore";

let lastLookup = new Date();

@BindToChainState()
class AccountsList extends React.Component {

    static propTypes = {
        accounts: ChainTypes.ChainAccountsList.isRequired,
        dashboardFilter: React.PropTypes.string,
        myAccountsOnly: React.PropTypes.bool,
        notMyAccountsOnly: React.PropTypes.bool
    };

    static contextTypes = {
        history: PropTypes.history
    };

    static defaultProps = {
        width: 2000,
        compact: false,
        dashboardFilter: "",
        myAccountsOnly: false,
        notMyAccountsOnly: false
    };

    constructor(props) {
        super();

        let inputValue = props.viewSettings.get("marketLookupInput");
        let symbols = inputValue ? inputValue.split(":") : [null];
        let quote = symbols[0];
        let base = symbols.length === 2 ? symbols[1] : null;

        this.state = {
            inverseSort: props.viewSettings.get("dashboardSortInverse") || true,
            sortBy: props.viewSettings.get("dashboardSort") || "star"
        };

    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps.accounts, this.props.accounts) ||
            !nextProps.dashboardFilter !== this.props.dashboardFilter ||
            nextProps.width !== this.props.width ||
            !utils.are_equal_shallow(nextProps.starredAccounts, this.props.starredAccounts) ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    _onStar(account, isStarred, e) {
        e.preventDefault();
        if (!isStarred) {
            SettingsActions.addStarAccount(account);
        } else {
            SettingsActions.removeStarAccount(account);
        }
    }

    _goAccount(name) {
        this.context.history.pushState(null, `/account/${name}`);
    }

    _setSort(field) {
        let inverse = field === this.state.sortBy ? !this.state.inverseSort : this.state.inverseSort;
        this.setState({
          sortBy: field,
          inverseSort: inverse
        });

        SettingsActions.changeViewSetting({
            dashboardSort: field,
            dashboardSortInverse: inverse
        });
      }

    render() {
        let {width, starredAccounts} = this.props;
        let {sortBy, inverseSort} = this.state;
        let balanceList = Immutable.List();

        let starSort = function(a, b, inverse) {
            let aName = a.get("name");
            let bName = b.get("name");
            let aStarred = starredAccounts.has(aName);
            let bStarred = starredAccounts.has(bName);

            if (aStarred && !bStarred) {
                return inverse ? -1 : 1;
            } else if (bStarred && !aStarred) {
                return inverse ? 1 : -1;
            } else {
                if (aName > bName) {
                    return inverse ? 1 : -1;
                } else if (aName < bName) {
                    return inverse ? -1 : 1;
                } else {
                    return utils.sortText(aName, bName, !inverse);
                }
            }
        };

        let accounts = this.props.accounts
        .filter(a => {
            if (!a) return false;
            if (this.props.myAccountsOnly && !AccountStore.isMyAccount(a)) return false;
            if (this.props.notMyAccountsOnly && AccountStore.isMyAccount(a)) return false;
            return a.get("name").indexOf(this.props.dashboardFilter) !== -1;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "star":
                    return starSort(a, b, inverseSort);
                    break;

                case "name":
                    return utils.sortText(a.get("name"), b.get("name"), inverseSort);
                    break;

                default:
                    break;
            }
        }).map(account => {
            if (account) {
                let collateral = 0, debt = {}, openOrders = {};
                balanceList = balanceList.clear();

                let accountName = account.get("name");

                account.get("orders").forEach( (orderID, key) => {
                    let order = ChainStore.getObject(orderID);
                    if (order) {
                        let orderAsset = order.getIn(["sell_price", "base", "asset_id"]);
                        if (!openOrders[orderAsset]) {
                            openOrders[orderAsset] = parseInt(order.get("for_sale"), 10);
                        } else {
                            openOrders[orderAsset] += parseInt(order.get("for_sale"), 10);
                        }
                    }
                });

                // console.log("openOrders:", openOrders);

                account.get("call_orders").forEach( (callID, key) => {
                    let position = ChainStore.getObject(callID);
                    if (position) {
                        collateral += parseInt(position.get("collateral"), 10);

                        let debtAsset = position.getIn(["call_price", "quote", "asset_id"]);
                        if (!debt[debtAsset]) {
                            debt[debtAsset] = parseInt(position.get("debt"), 10);
                        } else {
                            debt[debtAsset] += parseInt(position.get("debt"), 10);
                        }
                    }
                });

                let account_balances = account.get("balances");
                account_balances.forEach( balance => {
                    let balanceAmount = ChainStore.getObject(balance);
                    if (!balanceAmount || !balanceAmount.get("balance")) {
                        return null;
                    }
                    balanceList = balanceList.push(balance);
                });

                let isMyAccount = AccountStore.isMyAccount(account);

                let isStarred = starredAccounts.has(accountName);
                let starClass = isStarred ? "gold-star" : "grey-star";

                return (
                    <tr key={accountName}>
                        {/*<td onClick={this._onStar.bind(this, accountName, isStarred)}>
                            <Icon className={starClass} name="fi-star"/>
                        </td>*/}
                        <td onClick={this._goAccount.bind(this, accountName)} className={isMyAccount ? "my-account" : ""}>
                            {accountName}
                        </td>
                        <td onClick={this._goAccount.bind(this, `${accountName}/orders`)} style={{textAlign: "right"}}>
                            <TotalBalanceValue balances={[]} openOrders={openOrders}/>
                        </td>
                        {width >= 750 ? <td onClick={this._goAccount.bind(this, accountName)} style={{textAlign: "right"}}>
                            <TotalBalanceValue balances={[]} collateral={collateral}/>
                        </td> : null}
                        {width >= 1200 ? <td onClick={this._goAccount.bind(this, accountName)} style={{textAlign: "right"}}>
                            <TotalBalanceValue balances={[]} debt={debt}/>
                        </td> : null}
                        <td onClick={this._goAccount.bind(this, accountName)} style={{textAlign: "right"}}>
                            <TotalBalanceValue balances={balanceList} collateral={collateral} debt={debt} openOrders={openOrders}/>
                        </td>
                    </tr>
                )
            }
        });

        if (accounts.length === 0) return null;

        return (
            <div className="accounts-list">
                <h4>{this.props.title}</h4>
                <table className="table table-hover">
                    <thead>
                        <tr>
                            {/*<th onClick={this._setSort.bind(this, 'star')} className="clickable"><Icon className="grey-star" name="fi-star"/></th>*/}
                            <th onClick={this._setSort.bind(this, 'name')} className="clickable"><Translate content="header.account" /></th>
                            <th style={{textAlign: "right"}}><Translate content="account.open_orders" /></th>
                            {width >= 750 ? <th style={{textAlign: "right"}}><Translate content="account.as_collateral" /></th> : null}
                            {width >= 1200 ? <th style={{textAlign: "right"}}><Translate content="transaction.borrow_amount" /></th> : null}
                            <th style={{textAlign: "right"}}><Translate content="account.total_value" /></th>
                        </tr>
                    </thead>) : null}
                    <tbody>
                        {accounts}
                    </tbody>
                </table>
            </div>          
        )

    }

}


@connectToStores
class AccountsListWrapper extends React.Component {
    
    static getStores() {
        return [SettingsStore]
    };

    static getPropsFromStores() {
        return {
            starredAccounts: SettingsStore.getState().starredAccounts,
            viewSettings: SettingsStore.getState().viewSettings
        }
    };

    render () {
        return (
            <AccountsList
                {...this.props}
            />
        );
    }
}

export default AccountsListWrapper;
