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
import {Table, Select, Icon as IconStyleGuide} from "bitshares-ui-style-guide";
import SearchInput from "../Utility/SearchInput";
import {ChainStore} from "tuscjs";

class Accounts extends React.Component {
    constructor(props) {
        super();
        this.state = {
            searchTerm: props.searchTerm,
            isLoading: false,
            rowsOnPage: "25"
        };

        this._searchAccounts = debounce(this._searchAccounts, 200);
        this.handleRowsChange = this.handleRowsChange.bind(this);

        this.balanceObjects = [];
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

    handleRowsChange(rows) {
        this.setState({
            rowsOnPage: rows
        });
        this.forceUpdate();
    }

    _ensureBalanceObject(object_id) {
        if (object_id && typeof object_id === "string") {
            if (!this.balanceObjects[object_id]) {
                this.balanceObjects[object_id] = parseFloat(
                    ChainStore.getObject(object_id).get("balance")
                );
            }
        }
        if (!this.balanceObjects[object_id]) {
            this.balanceObjects[object_id] = 0;
        }
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
                    this._ensureBalanceObject(a.accountBalance);
                    this._ensureBalanceObject(b.accountBalance);

                    return this.balanceObjects[a.accountBalance] >
                        this.balanceObjects[b.accountBalance]
                        ? 1
                        : this.balanceObjects[a.accountBalance] <
                          this.balanceObjects[b.accountBalance]
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
                dataIndex: "accountBalance",
                key: "accountBalancePercentage",
                sorter: (a, b) => {
                    this._ensureBalanceObject(a.accountBalance);
                    this._ensureBalanceObject(b.accountBalance);

                    return this.balanceObjects[a.accountBalance] >
                        this.balanceObjects[b.accountBalance]
                        ? 1
                        : this.balanceObjects[a.accountBalance] <
                          this.balanceObjects[b.accountBalance]
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
                        accountBalance: balance
                    });
                });
        }

        return (
            <div className="grid-block vertical">
                <div className="grid-block vertical">
                    <div className="grid-block main-content small-12 medium-10 medium-offset-1 main-content vertical">
                        <div className="generic-bordered-box">
                            <div
                                style={{
                                    textAlign: "left",
                                    marginBottom: "24px"
                                }}
                            >
                                <SearchInput
                                    placeholder={"Search"}
                                    value={this.state.searchTerm}
                                    style={{width: "200px"}}
                                    onChange={this._onSearchChange.bind(this)}
                                />

                                <Select
                                    style={{width: "150px", marginLeft: "24px"}}
                                    value={this.state.rowsOnPage}
                                    onChange={this.handleRowsChange}
                                >
                                    <Select.Option key={"10"}>
                                        10 rows
                                    </Select.Option>
                                    <Select.Option key={"25"}>
                                        25 rows
                                    </Select.Option>
                                    <Select.Option key={"50"}>
                                        50 rows
                                    </Select.Option>
                                    <Select.Option key={"100"}>
                                        100 rows
                                    </Select.Option>
                                    <Select.Option key={"200"}>
                                        200 rows
                                    </Select.Option>
                                </Select>

                                <div
                                    style={{
                                        display: "inline-block",
                                        marginLeft: "24px"
                                    }}
                                >
                                    {this.state.searchTerm &&
                                    this.state.searchTerm.length == 0 ? (
                                        <Translate content="account.start_typing_to_search" />
                                    ) : null}
                                </div>
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
