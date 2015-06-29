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
        this.ACTIVE = Symbol("active");
        this.OWNER = Symbol("owner");
        this.state = {
            active_permissions: Immutable.List.of({type: "account", name: "alice", weight: 10}, {type: "account", name: "bob", weight: 10}, {type: "key", name: "WIFPUBLICKEY", weight: 80}),
            active_threshold: 100,
            owner_permissions: Immutable.List.of({type: "account", name: "alice", weight: 10}, {type: "account", name: "bob", weight: 10}, {type: "key", name: "WIFPUBLICKEY", weight: 80}),
            owner_threshold: 100
        }
    }

    onAddRow(type, name, weight) {
        console.log("[AccountPermissions.jsx:39] ----- onAddRow ----->", type, name, weight);
        if(type === this.ACTIVE){
            this.state.active_permissions = this.state.active_permissions.push({type: "account", name: name, weight: weight});
            this.setState({active_permissions: this.state.active_permissions});
        } else {
            this.state.owner_permissions = this.state.owner_permissions.push({type: "account", name: name, weight: weight});
            this.setState({owner_permissions: this.state.owner_permissions});
        }
    }

    onRemoveRow(type, name) {
        console.log("[AccountPermissions.jsx:39] ----- onRemoveRow ----->", type, name);
        if(type === this.ACTIVE) {
            let index = this.state.active_permissions.findIndex(i => i.name === name);
            if (index >= 0) {
                this.state.active_permissions = this.state.active_permissions.delete(index);
                this.setState({active_permissions: this.state.active_permissions});
            }
        } else {
            let index = this.state.owner_permissions.findIndex(i => i.name === name);
            if (index >= 0) {
                this.state.owner_permissions = this.state.owner_permissions.delete(index);
                this.setState({owner_permissions: this.state.owner_permissions});
            }
        }
    }

    render() {
        //console.log("[AccountPermissions.jsx:38] ----- render ----->", Symbol("active"));
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
                                onAddRow={this.onAddRow.bind(this, this.ACTIVE)}
                                onRemoveRow={this.onRemoveRow.bind(this, this.ACTIVE)}/>
                        </Tabs.Tab>

                        <Tabs.Tab title="Owner">
                            <PermissionsTable
                                permissions={this.state.owner_permissions}
                                accounts={all_accounts}
                                onAddRow={this.onAddRow.bind(this, this.OWNER)}
                                onRemoveRow={this.onRemoveRow.bind(this, this.OWNER)}/>
                        </Tabs.Tab>

                    </Tabs>
                </div>
            </div>
        );
    }
}

export default AccountPermissions;
