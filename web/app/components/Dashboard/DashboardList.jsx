import React from "react";
import Immutable from "immutable";
import utils from "common/utils";
import Translate from "react-translate-component";
import { connect } from "alt-react";
import SettingsStore from "stores/SettingsStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import SettingsActions from "actions/SettingsActions";
import Icon from "../Icon/Icon";
import {ChainStore} from "bitsharesjs/es";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import AccountStore from "stores/AccountStore";
import counterpart from "counterpart";

const starSort = function(a, b, inverse, starredAccounts) {
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


class DashboardList extends React.Component {
	static contextTypes = {
		router: React.PropTypes.object.isRequired
	}

	static propTypes = {
		accounts: ChainTypes.ChainAccountsList.isRequired,
		ignoredAccounts: ChainTypes.ChainAccountsList
	};

	static defaultProps = {
		width: 2000,
		compact: false
	};

	constructor(props) {
		super();
		let inputValue = props.viewSettings.get("marketLookupInput");
		let symbols = inputValue ? inputValue.split(":") : [null];
		let quote = symbols[0];
		let base = symbols.length === 2 ? symbols[1] : null;

		this.state = {
			inverseSort: props.viewSettings.get("dashboardSortInverse", true),
			sortBy: props.viewSettings.get("dashboardSort", "star"),
			dashboardFilter: props.viewSettings.get("dashboardFilter", "")
		};

	}

	shouldComponentUpdate(nextProps, nextState) {
		return (
			!utils.are_equal_shallow(nextProps.accounts, this.props.accounts) ||
			nextProps.width !== this.props.width ||
			nextProps.showIgnored !== this.props.showIgnored ||
			nextProps.locked !== this.props.locked ||
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
		this.context.router.push(`/account/${name}`);
	}

	_onFilter(e) {
		this.setState({dashboardFilter: e.target.value.toLowerCase()});

		SettingsActions.changeViewSetting({
			dashboardFilter: e.target.value.toLowerCase()
		});
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

	_renderList(accounts) {
		const {width, starredAccounts} = this.props;
		const {dashboardFilter, sortBy, inverseSort} = this.state;
		let balanceList = Immutable.List();

		return accounts
		.filter(a => {
			if (!a) return false;
			return a.get("name").toLowerCase().indexOf(dashboardFilter) !== -1;
		})
		.sort((a, b) => {
			switch (sortBy) {
				case "star":
					return starSort(a, b, inverseSort, starredAccounts);
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
				let isLTM = account.get("lifetime_referrer_name") === accountName;

				if (account.get("orders")) {
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
				}

				// console.log("openOrders:", openOrders);

				if (account.get("call_orders")) {
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
				}

				let account_balances = account.get("balances");
				if (account.get("balances")) {
					account_balances.forEach( balance => {
						let balanceAmount = ChainStore.getObject(balance);
						if (!balanceAmount || !balanceAmount.get("balance")) {
							return null;
						}
						balanceList = balanceList.push(balance);
					});
				}

				let isMyAccount = AccountStore.isMyAccount(account);

				let isStarred = starredAccounts.has(accountName);
				let starClass = isStarred ? "gold-star" : "grey-star";

				return (
					<tr key={accountName}>
						<td onClick={this._onStar.bind(this, accountName, isStarred)}>
							<Icon className={starClass} name="fi-star"/>
						</td>
						<td onClick={this._goAccount.bind(this, `${accountName}/overview`)} className={isMyAccount ? "my-account" : ""}>
							<span className={isLTM ? "lifetime" : ""}>{accountName}</span>
						</td>
						<td onClick={this._goAccount.bind(this, `${accountName}/orders`)} style={{textAlign: "right"}}>
							<TotalBalanceValue balances={[]} openOrders={openOrders}/>
						</td>
						{width >= 750 ? <td onClick={this._goAccount.bind(this, `${accountName}/overview`)} style={{textAlign: "right"}}>
							<TotalBalanceValue balances={[]} collateral={collateral}/>
						</td> : null}
						{width >= 1200 ? <td onClick={this._goAccount.bind(this, `${accountName}/overview`)} style={{textAlign: "right"}}>
							<TotalBalanceValue balances={[]} debt={debt}/>
						</td> : null}
						<td onClick={this._goAccount.bind(this, `${accountName}/overview`)} style={{textAlign: "right"}}>
							<TotalBalanceValue balances={balanceList} collateral={collateral} debt={debt} openOrders={openOrders}/>
						</td>
					</tr>
				);
			}
		});
	}

	render() {
		let { width, showIgnored } = this.props;
		const { dashboardFilter } = this.state;

		let includedAccounts = this._renderList(this.props.accounts);

		let hiddenAccounts = showIgnored ? this._renderList(this.props.ignoredAccounts) : null;

		let filterText = counterpart.translate("explorer.accounts.filter") + "...";

		return (
			<div style={this.props.style}>
				{!this.props.compact ? (
					<section style={{paddingLeft: "5px", width: "100%", position: "relative"}}>
						<input placeholder={filterText} type="text" value={dashboardFilter} onChange={this._onFilter.bind(this)} />
						{this.props.ignoredAccounts.length ? <div onClick={this.props.onToggleIgnored} style={{position: "absolute", top: 0, right: 0}} className="button outline small">
							<Translate content={`account.${ this.props.showIgnored ? "hide_ignored" : "show_ignored" }`} />
						</div> : null}
					</section>) : null}
				<table className="table table-hover" style={{fontSize: "0.85rem"}}>
					{!this.props.compact ? (
					<thead>
						<tr>
							<th onClick={this._setSort.bind(this, "star")} className="clickable"><Icon className="grey-star" name="fi-star"/></th>
							<th onClick={this._setSort.bind(this, "name")} className="clickable"><Translate content="header.account" /></th>
							<th style={{textAlign: "right"}}><Translate content="account.open_orders" /></th>
							{width >= 750 ? <th style={{textAlign: "right"}}><Translate content="account.as_collateral" /></th> : null}
							{width >= 1200 ? <th style={{textAlign: "right"}}><Translate content="transaction.borrow_amount" /></th> : null}
							<th style={{textAlign: "right"}}><Translate content="account.total_value" /></th>
						</tr>
					</thead>) : null}
					<tbody>
						{includedAccounts}
						{showIgnored ? <tr style={{backgroundColor: "transparent"}} key="hidden"><td style={{height: 20}} colSpan="4"></td></tr> : null}
						{hiddenAccounts}
					</tbody>
				</table>
			</div>
		);
	}
}
DashboardList = BindToChainState(DashboardList);

class AccountsListWrapper extends React.Component {

	render () {
		return (
			<DashboardList
				{...this.props}
			/>
		);
	}
}

export default connect(AccountsListWrapper, {
	listenTo() {
		return [SettingsStore, WalletUnlockStore];
	},
	getProps() {
		return {
			locked: WalletUnlockStore.getState().locked,
			starredAccounts: SettingsStore.getState().starredAccounts,
			viewSettings: SettingsStore.getState().viewSettings
		};
	}
});
