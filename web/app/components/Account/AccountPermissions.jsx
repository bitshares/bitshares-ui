import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import Tabs from "react-foundation-apps/src/tabs";
import AutocompleteInput from "../Forms/AutocompleteInput";
import PermissionsTable from "./PermissionsTable";

class AccountPermissions extends React.Component {

    constructor() {
        super();
        this.state = {
            active_permissions: Immutable.List.of("Alice", "Bob"),
            owner_permissions: Immutable.List.of("Alice", "Bob")
        }
    }

    //handleAddActiveAccount(e) {
    //    e.preventDefault();
    //    let value = this.refs.select_active_account.value();
    //    if (!value) return;
    //    this.state.active_permissions = this.state.active_permissions.push(value);
    //    this.setState({active_permissions: this.state.active_permissions});
    //    this.refs.select_active_account.clear();
    //}
    //
    //handleAddOwnerAccount(e) {
    //    e.preventDefault();
    //    let value = this.refs.select_owner_account.value();
    //    if (!value) return;
    //    this.state.owner_permissions = this.state.owner_permissions.push(value);
    //    this.setState({owner_permissions: this.state.owner_permissions});
    //    this.refs.select_owner_account.clear();
    //}

    onAddRow(type, name, weight) {
        console.log("[AccountPermissions.jsx:39] ----- onAddRow ----->", type, name, weight);
    }

    onRemoveRow(name) {
        console.log("[AccountPermissions.jsx:39] ----- onRemoveRow ----->", name);
    }

    render() {
        console.log("[AccountPermissions.jsx:38] ----- render ----->", this.state);
        let ad = this.props.all_delegates;
        let all_accounts = Object.keys(ad).map(k => [`["${ad[k]}","${k}"]`, k]);

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Account Permissions</h3>
                    <Tabs>

                        <Tabs.Tab title="Active">
                            <PermissionsTable
                                permissions={this.state.active_permissions}
                                accounts={all_accounts}
                                onAddRow={this.onAddRow.bind(this)}
                                onRemoveRow={this.onRemoveRow.bind(this)}/>
                        </Tabs.Tab>

                        <Tabs.Tab title="Owner">
                            <PermissionsTable
                                permissions={this.state.owner_permissions}
                                accounts={all_accounts}
                                onAddRow={this.onAddRow.bind(this)}
                                onRemoveRow={this.onRemoveRow.bind(this)}/>
                        </Tabs.Tab>

                    </Tabs>
                </div>
            </div>
        );
    }
}

export default AccountPermissions;
