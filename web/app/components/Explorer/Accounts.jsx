import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router/es";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import {debounce} from "lodash";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import BalanceComponent from "../Utility/BalanceComponent";

class AccountRow extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        tempComponent: "tr"
    };

    render() {
        let {account} = this.props;
        let balance = account.getIn(["balances", "1.3.0"]) || null;

        return (
            <tr key={account.get("id")}>
                <td>{account.get("id")}</td>
                <td><Link to={`/account/${account.get("name")}/overview`}>{account.get("name")}</Link></td>
                <td>{!balance? "n/a" : <BalanceComponent balance={balance} />}</td>
                <td>{!balance ? "n/a" : <BalanceComponent balance={balance} asPercentage={true} />}</td>
            </tr>
        );
    }
}
AccountRow = BindToChainState(AccountRow);

class Accounts extends React.Component {

    constructor(props) {
        super();
        this.state = {
            searchTerm: props.searchTerm
        };

        this._searchAccounts = debounce(this._searchAccounts, 200);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
                !Immutable.is(nextProps.searchAccounts, this.props.searchAccounts) ||
                nextState.searchTerm !== this.state.searchTerm
            );
    }

    _onSearchChange(e) {
        this.setState({searchTerm: e.target.value.toLowerCase()});
        this._searchAccounts(e.target.value);
    }

    _searchAccounts(searchTerm) {
        AccountActions.accountSearch(searchTerm);
    }

    render() {
        let {searchAccounts} = this.props;
        let {searchTerm} = this.state;
        let accountRows = null;

        if (searchAccounts.size > 0 && searchTerm &&searchTerm.length > 0) {
            accountRows = searchAccounts.filter(a => {
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
                return (
                    <AccountRow key={id} account={account} />
                );
            }).toArray();
        }

        return (
            <div className="grid-block page-layout">
                <div className="grid-block vertical medium-6 medium-offset-3">
                    <div className="grid-content shrink">
                        <Translate component="h3" content="explorer.accounts.title" />
                        <input type="text" value={this.state.searchTerm} onChange={this._onSearchChange.bind(this)}/>
                    </div>
                    <div className="grid-content">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Translate component="span" content="explorer.assets.id" /></th>
                                    <th><Translate component="span" content="account.name" /></th>
                                    <th><Translate component="span" content="gateway.balance" /></th>
                                    <th><Translate component="span" content="account.percent" /></th>
                                </tr>
                            </thead>

                            <tbody>
                                {accountRows}
                            </tbody>
                        </table>
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
