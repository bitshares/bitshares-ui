import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import Tabs from "react-foundation-apps/src/tabs";
import AutocompleteInput from "../Forms/AutocompleteInput";

class PermissionsTable extends React.Component {
    render() {
        return (
            <table className="table">
                <thead>
                <tr>
                    <th>Key</th>
                    <th>Address/Name</th>
                    <th>Weight</th>
                </tr>
                </thead>
                <tbody>
                {this.props.rows}
                </tbody>
            </table>
        );
    }
}

class AccountPermissions extends React.Component {

    constructor() {
        super();
        this.state = {
            active_permissions: Immutable.List.of("Alice","Bob"),
            owner_permissions: Immutable.List.of("Alice","Bob")
        }
    }

    handleAddActiveAccount(e) {
        e.preventDefault();
        let value = this.refs.select_active_account.value();
        if(!value) return;
        this.state.active_permissions = this.state.active_permissions.push(value);
        this.setState({active_permissions: this.state.active_permissions});
        this.refs.select_active_account.clear();
    }

    handleAddOwnerAccount(e) {
        e.preventDefault();
        let value = this.refs.select_owner_account.value();
        if(!value) return;
        this.state.owner_permissions = this.state.owner_permissions.push(value);
        this.setState({owner_permissions: this.state.owner_permissions});
        this.refs.select_owner_account.clear();
    }

    render() {
        console.log("[AccountPermissions.jsx:38] ----- render ----->", this.state);
        let ad = this.props.all_delegates;
        let all_accounts = Object.keys(ad).map(k => [`["${ad[k]}","${k}"]`, k]);

        let active_permissions_rows = this.state.active_permissions.map( p => {
            return (
                <tr key={p}>
                    <td></td>
                    <td>{p}</td>
                    <td>10</td>
                </tr>
            );
        });

        let owner_permissions_rows = this.state.owner_permissions.map( p => {
            return (
                <tr key={p}>
                    <td></td>
                    <td>{p}</td>
                    <td>10</td>
                </tr>
            );
        });


        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Account Permissions</h3>
                    <Tabs>

                        <Tabs.Tab title="Active">
                            <PermissionsTable rows={active_permissions_rows}/>
                            <div className="actions">
                                <div className="medium-3">
                                    <div className="float-right"><a href="#" className="button" onClick={this.handleAddActiveAccount.bind(this)}>Add</a></div>
                                    <AutocompleteInput id="select_active_account" options={all_accounts} ref="select_active_account"/>
                                </div>
                            </div>
                        </Tabs.Tab>

                        <Tabs.Tab title="Owner">
                            <PermissionsTable rows={owner_permissions_rows}/>
                            <div className="actions">
                                <div className="medium-3">
                                    <div className="float-right"><a href="#" className="button" onClick={this.handleAddOwnerAccount.bind(this)}>Add</a></div>
                                    <AutocompleteInput id="select_owner_account" options={all_accounts} ref="select_owner_account"/>
                                </div>
                            </div>
                        </Tabs.Tab>

                    </Tabs>
                </div>
            </div>
        );
    }
}

export default AccountPermissions;
