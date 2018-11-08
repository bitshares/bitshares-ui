import React from "react";
import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import {debounce} from "lodash-es";
import Icon from "../Icon/Icon";
import BalanceComponent from "../Utility/BalanceComponent";
import AccountStore from "stores/AccountStore";
import LoadingIndicator from "../LoadingIndicator";
import {Table} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";

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

    _onAddContact(account, e) {
        e.preventDefault();
        AccountActions.addAccountContact(account);
        this.forceUpdate();
    }

    _onRemoveContact(account, e) {
        e.preventDefault();
        AccountActions.removeAccountContact(account);
        this.forceUpdate();
    }

    render() {
        let {searchAccounts} = this.props;
        let {searchTerm} = this.state;

        let dataSource = [];
        let columns = [];

        columns = [
            {
                title: (
                    <Translate component="span" content="explorer.assets.id" />
                ),
                dataIndex: "accountId",
                key: "accountId",
                defaultSortOrder: "ascend",
                sorter: (a, b) => {
                    return a.accountId > b.accountId
                        ? 1
                        : a.accountId < b.accountId
                            ? -1
                            : 0;
                },
                render: id => {
                    return <div>{id}</div>;
                }
            },
            {
                title: <Icon name="user" title="icons.user.account" />,
                dataIndex: "accountContacts",
                key: "accountContacts",
                render: (contacts, record) => {
                    return contacts.has(record.accountName) ? (
                        <div
                            onClick={this._onRemoveContact.bind(
                                this,
                                record.accountName
                            )}
                        >
                            <Icon
                                name="minus-circle"
                                title="icons.minus_circle.remove_contact"
                            />
                        </div>
                    ) : (
                        <div
                            onClick={this._onAddContact.bind(
                                this,
                                record.accountName
                            )}
                        >
                            <Icon
                                name="plus-circle"
                                title="icons.plus_circle.add_contact"
                            />
                        </div>
                    );
                }
            },
            {
                title: <Translate component="span" content="account.name" />,
                dataIndex: "accountName",
                key: "accountName",
                sorter: (a, b) => {
                    return a.accountName > b.accountName
                        ? 1
                        : a.accountName < b.accountName
                            ? -1
                            : 0;
                },
                render: name => {
                    return (
                        <div>
                            <Link to={`/account/${name}/overview`}>{name}</Link>
                        </div>
                    );
                }
            },
            {
                title: <Translate component="span" content="gateway.balance" />,
                dataIndex: "accountBalance",
                key: "accountBalance",
                sorter: (a, b) => {
                    a.accountBalance = parseFloat(a.accountBalance);
                    b.accountBalance = parseFloat(b.accountBalance);
                    return a.accountBalance > b.accountBalance
                        ? 1
                        : a.accountBalance < b.accountBalance
                            ? -1
                            : 0;
                },
                render: balance => {
                    return (
                        <div>
                            {!balance ? (
                                "n/a"
                            ) : (
                                <BalanceComponent balance={balance} />
                            )}
                        </div>
                    );
                }
            },
            {
                title: <Translate component="span" content="account.percent" />,
                dataIndex: "accountPercentages",
                key: "accountPercentages",
                sorter: (a, b) => {
                    a.accountPercentages = parseFloat(a.accountPercentages);
                    b.accountPercentages = parseFloat(b.accountPercentages);
                    return a.accountPercentages > b.accountPercentages
                        ? 1
                        : a.accountPercentages < b.accountPercentages
                            ? -1
                            : 0;
                },
                render: balance => {
                    return (
                        <div>
                            {!balance ? (
                                "n/a"
                            ) : (
                                <BalanceComponent
                                    balance={balance}
                                    asPercentage={true}
                                />
                            )}
                        </div>
                    );
                }
            }
        ];

        if (searchAccounts.size > 0 && searchTerm && searchTerm.length > 0) {
            searchAccounts
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
                .map((name, id) => {
                    let currentAccount = ChainStore.getAccount(
                        id.toLowerCase()
                    );
                    let balance = currentAccount
                        ? currentAccount.getIn(["balances", "1.3.0"]) || null
                        : null;

                    dataSource.push({
                        accountId: id,
                        accountContacts: AccountStore.getState()
                            .accountContacts,
                        accountName: name,
                        accountBalance: balance,
                        accountPercentages: balance
                    });
                });
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
                    <Table
                        style={{width: "100%", marginTop: "16px"}}
                        rowKey="accountId"
                        columns={columns}
                        dataSource={dataSource}
                        pagination={{
                            position: "bottom",
                            pageSize: Number(this.state.rowsOnPage)
                        }}
                    />
                    {this.state.isLoading ? (
                        <div style={{textAlign: "center", padding: 10}}>
                            <LoadingIndicator type="three-bounce" />
                        </div>
                    ) : null}
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
