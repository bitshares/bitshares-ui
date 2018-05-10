import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router/es";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import {debounce} from "lodash";
import ChainTypes from "../Utility/ChainTypes";
import Icon from "../Icon/Icon";
import BindToChainState from "../Utility/BindToChainState";
import BalanceComponent from "../Utility/BalanceComponent";
import AccountStore from "stores/AccountStore";
import {connect} from "alt-react";
import LoadingIndicator from "../LoadingIndicator";

class AccountRow extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        tempComponent: "tr",
        autosubscribe: false
    };

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.contacts !== this.props.contacts ||
            nextProps.account !== this.props.account
        );
    }

    _onAddContact(account, e) {
        e.preventDefault();
        AccountActions.addAccountContact(account);
    }

    _onRemoveContact(account, e) {
        e.preventDefault();
        AccountActions.removeAccountContact(account);
    }

    render() {
        let {account, contacts} = this.props;

        if (!account) return null;
        let balance = account.getIn(["balances", "1.3.0"]) || null;
        let accountName = account.get("name");

        return (
            <tr key={account.get("id")}>
                <td>{account.get("id")}</td>
                {contacts.has(accountName) ? (
                    <td onClick={this._onRemoveContact.bind(this, accountName)}>
                        <Icon name="minus-circle" />
                    </td>
                ) : (
                    <td onClick={this._onAddContact.bind(this, accountName)}>
                        <Icon name="plus-circle" />
                    </td>
                )}
                <td>
                    <Link to={`/account/${accountName}/overview`}>
                        {accountName}
                    </Link>
                </td>
                <td>
                    {!balance ? "n/a" : <BalanceComponent balance={balance} />}
                </td>
                <td>
                    {!balance ? (
                        "n/a"
                    ) : (
                        <BalanceComponent
                            balance={balance}
                            asPercentage={true}
                        />
                    )}
                </td>
            </tr>
        );
    }
}
AccountRow = BindToChainState(AccountRow);

let AccountRowWrapper = props => {
    return <AccountRow {...props} />;
};

AccountRowWrapper = connect(AccountRowWrapper, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            contacts: AccountStore.getState().accountContacts
        };
    }
});

class Accounts extends React.Component {
    constructor(props) {
        super();
        this.state = {
            searchTerm: props.searchTerm,
            isLoading: false
        };

        this._searchAccounts = debounce(this._searchAccounts, 200);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(
                nextProps.searchAccounts,
                this.props.searchAccounts
            ) ||
            nextState.searchTerm !== this.state.searchTerm ||
            nextState.isLoading !== this.state.isLoading
        );
    }

    _onSearchChange(e) {
        this.setState({
            searchTerm: e.target.value.toLowerCase(),
            isLoading: true
        });
        this._searchAccounts(e.target.value);
    }

    _searchAccounts(searchTerm) {
        AccountActions.accountSearch(searchTerm);
        this.setState({isLoading: false});
    }

    render() {
        let {searchAccounts} = this.props;
        let {searchTerm} = this.state;
        let accountRows = null;

        if (searchAccounts.size > 0 && searchTerm && searchTerm.length > 0) {
            accountRows = searchAccounts
                .filter(a => {
                    /*
                    * This appears to return false negatives, perhaps from
                    * changed account name rules when moving to graphene?. Either
                    * way, trying to resolve invalid names fails in the ChainStore,
                    * which in turn breaks the BindToChainState wrapper
                    */
                    // if (!ChainValidation.is_account_name(a, true)) {
                    //     return false;
                    // }
                    return a.indexOf(searchTerm) !== -1;
                })
                .sort((a, b) => {
                    if (a > b) {
                        return 1;
                    } else if (a < b) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                .map((account, id) => {
                    return <AccountRowWrapper key={id} account={account} />;
                })
                .toArray();
        }

        return (
            <div className="grid-block">
                <div className="grid-block vertical medium-6 medium-offset-3">
                    <div className="grid-content shrink">
                        <Translate
                            component="h3"
                            content="explorer.accounts.title"
                        />
                        <input
                            type="text"
                            value={this.state.searchTerm}
                            onChange={this._onSearchChange.bind(this)}
                        />
                    </div>
                    <div className="grid-content">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>
                                        <Translate
                                            component="span"
                                            content="explorer.assets.id"
                                        />
                                    </th>
                                    <th>
                                        <Icon name="user" />
                                    </th>
                                    <th>
                                        <Translate
                                            component="span"
                                            content="account.name"
                                        />
                                    </th>
                                    <th>
                                        <Translate
                                            component="span"
                                            content="gateway.balance"
                                        />
                                    </th>
                                    <th>
                                        <Translate
                                            component="span"
                                            content="account.percent"
                                        />
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {this.state.isLoading ? (
                                    <tr colSpan="5" />
                                ) : (
                                    accountRows
                                )}
                            </tbody>
                        </table>
                        {this.state.isLoading ? (
                            <div style={{textAlign: "center", padding: 10}}>
                                <LoadingIndicator type="three-bounce" />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }
}

Accounts.defaultProps = {
    searchAccounts: {}
};

Accounts.propTypes = {
    searchAccounts: PropTypes.object.isRequired
};

export default Accounts;
