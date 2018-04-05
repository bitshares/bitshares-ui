import React from "react";
import Immutable from "immutable";
import utils from "common/utils";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import SettingsActions from "actions/SettingsActions";
import AccountActions from "actions/AccountActions";
import Icon from "../Icon/Icon";
import {ChainStore} from "bitsharesjs/es";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import AccountStore from "stores/AccountStore";
import counterpart from "counterpart";
import WalletDb from "stores/WalletDb";

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
    };

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
            nextProps.isContactsList !== this.props.isContactsList ||
            nextProps.showMyAccounts !== this.props.showMyAccounts ||
            nextProps.width !== this.props.width ||
            nextProps.showIgnored !== this.props.showIgnored ||
            nextProps.locked !== this.props.locked ||
            nextProps.passwordAccount !== this.props.passwordAccount ||
            !utils.are_equal_shallow(
                nextProps.starredAccounts,
                this.props.starredAccounts
            ) ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    _onStar(account, isStarred, e) {
        e.preventDefault();
        if (!isStarred) {
            AccountActions.addStarAccount(account);
        } else {
            AccountActions.removeStarAccount(account);
        }
    }

    _goAccount(name, tab) {
        this.context.router.push(`/account/${name}`);
        SettingsActions.changeViewSetting({
            overviewTab: tab
        });
    }

    _createAccount() {
        this.context.router.push("/create-account/wallet");
    }

    _onFilter(e) {
        this.setState({dashboardFilter: e.target.value.toLowerCase()});

        SettingsActions.changeViewSetting({
            dashboardFilter: e.target.value.toLowerCase()
        });
    }

    _setSort(field) {
        let inverse =
            field === this.state.sortBy
                ? !this.state.inverseSort
                : this.state.inverseSort;
        this.setState({
            sortBy: field,
            inverseSort: inverse
        });

        SettingsActions.changeViewSetting({
            dashboardSort: field,
            dashboardSortInverse: inverse
        });
    }

    _onAddContact(account) {
        AccountActions.addAccountContact(account);
    }

    _onRemoveContact(account) {
        AccountActions.removeAccountContact(account);
    }

    _renderList(accounts, isHiddenAccountsList) {
        const {
            width,
            starredAccounts,
            isContactsList,
            passwordAccount
        } = this.props;
        const {dashboardFilter, sortBy, inverseSort} = this.state;
        let balanceList = Immutable.List();

        return accounts
            .filter(account => {
                if (!account) return false;
                let accountName = account.get("name");
                let isMyAccount =
                    AccountStore.isMyAccount(account) ||
                    accountName === passwordAccount;
                /*
                Display all accounts from contacts list
                Display only my Accounts for Accounts page
                */
                return isContactsList
                    ? true
                    : isMyAccount === this.props.showMyAccounts;
            })
            .filter(a => {
                if (!a) return false;
                return (
                    a
                        .get("name")
                        .toLowerCase()
                        .indexOf(dashboardFilter) !== -1
                );
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case "star":
                        return starSort(a, b, inverseSort, starredAccounts);
                        break;

                    case "name":
                        return utils.sortText(
                            a.get("name"),
                            b.get("name"),
                            inverseSort
                        );
                        break;

                    default:
                        break;
                }
            })
            .map(account => {
                if (account) {
                    let collateral = {},
                        debt = {},
                        openOrders = {};
                    balanceList = balanceList.clear();

                    let accountName = account.get("name");
                    let isLTM =
                        account.get("lifetime_referrer_name") === accountName;

                    if (account.get("orders")) {
                        account.get("orders").forEach((orderID, key) => {
                            let order = ChainStore.getObject(orderID);
                            if (order) {
                                let orderAsset = order.getIn([
                                    "sell_price",
                                    "base",
                                    "asset_id"
                                ]);
                                if (!openOrders[orderAsset]) {
                                    openOrders[orderAsset] = parseInt(
                                        order.get("for_sale"),
                                        10
                                    );
                                } else {
                                    openOrders[orderAsset] += parseInt(
                                        order.get("for_sale"),
                                        10
                                    );
                                }
                            }
                        });
                    }

                    // console.log("openOrders:", openOrders);

                    if (account.get("call_orders")) {
                        account.get("call_orders").forEach((callID, key) => {
                            let position = ChainStore.getObject(callID);
                            if (position) {
                                let collateralAsset = position.getIn([
                                    "call_price",
                                    "base",
                                    "asset_id"
                                ]);
                                if (!collateral[collateralAsset]) {
                                    collateral[collateralAsset] = parseInt(
                                        position.get("collateral"),
                                        10
                                    );
                                } else {
                                    collateral[collateralAsset] += parseInt(
                                        position.get("collateral"),
                                        10
                                    );
                                }
                                let debtAsset = position.getIn([
                                    "call_price",
                                    "quote",
                                    "asset_id"
                                ]);
                                if (!debt[debtAsset]) {
                                    debt[debtAsset] = parseInt(
                                        position.get("debt"),
                                        10
                                    );
                                } else {
                                    debt[debtAsset] += parseInt(
                                        position.get("debt"),
                                        10
                                    );
                                }
                            }
                        });
                    }

                    let account_balances = account.get("balances");
                    if (account.get("balances")) {
                        account_balances.forEach(balance => {
                            let balanceAmount = ChainStore.getObject(balance);
                            if (
                                !balanceAmount ||
                                !balanceAmount.get("balance")
                            ) {
                                return null;
                            }
                            balanceList = balanceList.push(balance);
                        });
                    }

                    let isMyAccount =
                        AccountStore.isMyAccount(account) ||
                        accountName === passwordAccount;

                    let isStarred = starredAccounts.has(accountName);
                    let starClass = isStarred ? "gold-star" : "grey-star";

                    return (
                        <tr key={accountName}>
                            <td
                                className="clickable"
                                onClick={this._onStar.bind(
                                    this,
                                    accountName,
                                    isStarred
                                )}
                            >
                                <Icon className={starClass} name="fi-star" />
                            </td>
                            {isContactsList
                                ? (isHiddenAccountsList && (
                                      <td
                                          onClick={this._onAddContact.bind(
                                              this,
                                              accountName
                                          )}
                                      >
                                          <Icon name="plus-circle" />
                                      </td>
                                  )) || (
                                      <td
                                          onClick={this._onRemoveContact.bind(
                                              this,
                                              accountName
                                          )}
                                      >
                                          <Icon name="minus-circle" />
                                      </td>
                                  )
                                : null}
                            <td style={{textAlign: "left"}}>
                                {account.get("id")}
                            </td>
                            <td
                                style={{textAlign: "left", paddingLeft: 10}}
                                onClick={this._goAccount.bind(
                                    this,
                                    accountName,
                                    0
                                )}
                                className={
                                    "clickable" +
                                    (isMyAccount ? " my-account" : "")
                                }
                            >
                                <span className={isLTM ? "lifetime" : ""}>
                                    {accountName}
                                </span>
                            </td>
                            <td
                                className="clickable"
                                onClick={this._goAccount.bind(
                                    this,
                                    accountName,
                                    1
                                )}
                                style={{textAlign: "right"}}
                            >
                                <TotalBalanceValue
                                    noTip
                                    balances={[]}
                                    openOrders={openOrders}
                                />
                            </td>
                            {width >= 750 ? (
                                <td
                                    className="clickable"
                                    onClick={this._goAccount.bind(
                                        this,
                                        accountName,
                                        2
                                    )}
                                    style={{textAlign: "right"}}
                                >
                                    <TotalBalanceValue
                                        noTip
                                        balances={[]}
                                        collateral={collateral}
                                    />
                                </td>
                            ) : null}
                            {width >= 1200 ? (
                                <td
                                    className="clickable"
                                    onClick={this._goAccount.bind(
                                        this,
                                        accountName,
                                        2
                                    )}
                                    style={{textAlign: "right"}}
                                >
                                    <TotalBalanceValue
                                        noTip
                                        balances={[]}
                                        debt={debt}
                                    />
                                </td>
                            ) : null}
                            <td
                                className="clickable"
                                onClick={this._goAccount.bind(
                                    this,
                                    accountName,
                                    0
                                )}
                                style={{textAlign: "right"}}
                            >
                                <TotalBalanceValue
                                    noTip
                                    balances={balanceList}
                                    collateral={collateral}
                                    debt={debt}
                                    openOrders={openOrders}
                                />
                            </td>
                        </tr>
                    );
                }
            });
    }

    render() {
        let {width, showIgnored, isContactsList} = this.props;
        const {dashboardFilter} = this.state;

        let includedAccounts = this._renderList(this.props.accounts);

        let hiddenAccounts = this._renderList(this.props.ignoredAccounts, true);

        let filterText = !isContactsList
            ? counterpart.translate("explorer.accounts.filter")
            : counterpart.translate("explorer.accounts.filter_contacts");
        filterText += "...";

        let hasLocalWallet = !!WalletDb.getWallet();

        return (
            <div style={this.props.style}>
                {!this.props.compact ? (
                    <section style={{paddingTop: "1rem", paddingLeft: "2rem"}}>
                        <input
                            placeholder={filterText}
                            style={{maxWidth: "20rem", display: "inline-block"}}
                            type="text"
                            value={dashboardFilter}
                            onChange={this._onFilter.bind(this)}
                        />
                        {hasLocalWallet && !isContactsList ? (
                            <div
                                onClick={this._createAccount.bind(this)}
                                style={{
                                    display: "inline-block",
                                    marginLeft: 5,
                                    marginBottom: "1rem"
                                }}
                                className="button small"
                            >
                                <Translate content="header.create_account" />
                            </div>
                        ) : null}
                        {hiddenAccounts && hiddenAccounts.length ? (
                            <div
                                onClick={this.props.onToggleIgnored}
                                style={{
                                    display: "inline-block",
                                    float: "right",
                                    marginRight: "20px"
                                }}
                                className="button small"
                            >
                                <Translate
                                    content={`account.${
                                        this.props.showIgnored
                                            ? "hide_ignored"
                                            : "show_ignored"
                                    }`}
                                />
                            </div>
                        ) : null}
                    </section>
                ) : null}
                <table
                    className="table table-hover dashboard-table"
                    style={{fontSize: "0.85rem"}}
                >
                    {!this.props.compact ? (
                        <thead>
                            <tr>
                                <th
                                    onClick={this._setSort.bind(this, "star")}
                                    className="clickable"
                                >
                                    <Icon
                                        className="grey-star"
                                        name="fi-star"
                                    />
                                </th>
                                {isContactsList ? (
                                    <th>
                                        <Icon name="user" />
                                    </th>
                                ) : null}
                                <th style={{textAlign: "left"}}>ID</th>
                                <th
                                    style={{textAlign: "left", paddingLeft: 10}}
                                    onClick={this._setSort.bind(this, "name")}
                                    className="clickable"
                                >
                                    <Translate content="header.account" />
                                </th>
                                <th style={{textAlign: "right"}}>
                                    <Translate content="account.open_orders" />
                                </th>
                                {width >= 750 ? (
                                    <th style={{textAlign: "right"}}>
                                        <Translate content="account.as_collateral" />
                                    </th>
                                ) : null}
                                {width >= 1200 ? (
                                    <th style={{textAlign: "right"}}>
                                        <Translate content="transaction.borrow_amount" />
                                    </th>
                                ) : null}
                                <th
                                    style={{
                                        textAlign: "right",
                                        marginRight: 20
                                    }}
                                >
                                    <Translate content="account.total_value" />
                                </th>
                            </tr>
                        </thead>
                    ) : null}
                    <tbody>
                        {includedAccounts}
                        {showIgnored && hiddenAccounts.length ? (
                            <tr
                                className="dashboard-table--hiddenAccounts"
                                style={{backgroundColor: "transparent"}}
                                key="hidden"
                            >
                                <td colSpan="8">
                                    {counterpart.translate(
                                        "account.hidden_accounts_row"
                                    )}:
                                </td>
                            </tr>
                        ) : null}
                        {showIgnored && hiddenAccounts}
                    </tbody>
                </table>
            </div>
        );
    }
}
DashboardList = BindToChainState(DashboardList);

class AccountsListWrapper extends React.Component {
    render() {
        return <DashboardList {...this.props} />;
    }
}

export default connect(AccountsListWrapper, {
    listenTo() {
        return [SettingsStore, WalletUnlockStore, AccountStore];
    },
    getProps() {
        return {
            locked: WalletUnlockStore.getState().locked,
            starredAccounts: AccountStore.getState().starredAccounts,
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
