import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import debounce from "lodash.debounce";

class Accounts extends React.Component {

    constructor() {
        super();
        this.state = {
            searchTerm: ""
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
        this.setState({searchTerm: e.target.value});
        this._searchAccounts(e.target.value);
    }

    _searchAccounts(searchTerm) {
        AccountActions.accountSearch(searchTerm);
    }

    render() {
        let {searchAccounts} = this.props;
        let accountRows = null;

        if (searchAccounts.size > 0) {
            accountRows = searchAccounts.filter(a => {
                return a.indexOf(this.state.searchTerm) !== -1;
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
                    <tr key={account}>
                        <td>{id}</td>
                        <td><Link to="account" params={{name: account}}>{account}</Link></td>
                    </tr>
                );
            }).toArray();
        }

        return (
            <div className="grid-block page-layout">
                <div className="grid-block vertical medium-6 medium-offset-3">
                    <div className="grid-content shrink">
                        <h3>Accounts</h3>
                        <input type="text" value={this.state.searchTerm} onChange={this._onSearchChange.bind(this)}/>
                    </div>
                    <div className="grid-content">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Translate component="span" content="explorer.assets.id" /></th>
                                    <th><Translate component="span" content="account.name" /></th>
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
    searchAccounts: []
};

Accounts.propTypes = {
    searchAccounts: PropTypes.object.isRequired
};

export default Accounts;
