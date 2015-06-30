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
        this.initial_data = {
            active_permissions: Immutable.List.of({type: "account", name: "alice", weight: 10}, {type: "account", name: "bob", weight: 10}, {type: "key", name: "WIFPUBLICKEY", weight: 80}),
            active_threshold: 90,
            owner_permissions: Immutable.List.of({type: "account", name: "alice", weight: 10}, {type: "account", name: "bob", weight: 10}, {type: "key", name: "WIFPUBLICKEY", weight: 80}),
            owner_threshold: 90
        };
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            active_permissions: this.initial_data.active_permissions,
            active_threshold: this.initial_data.active_threshold,
            owner_permissions: this.initial_data.owner_permissions,
            owner_threshold: this.initial_data.owner_threshold
        }
    }

    isStateChanged() {
        return  this.state.active_permissions !== this.initial_data.active_permissions ||
            this.state.active_threshold !== this.initial_data.active_threshold ||
            this.state.owner_permissions !== this.initial_data.owner_permissions ||
            this.state.owner_threshold !== this.initial_data.owner_threshold
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

    onThresholdChanged(type, value) {
        console.log("[AccountPermissions.jsx:53] ----- onThresholdChanged ----->", type, value);
        if(type === this.ACTIVE) {
            this.setState({active_threshold: value});
        } else {
            this.setState({owner_threshold: value});
        }
    }

    onPublish() {
        console.log("[AccountPermissions.jsx:53] ----- onPublish ----->");
    }

    onResetChanges(e) {
        e.preventDefault();
        this.setState(this.getInitialState());
    }

    render() {
        console.log("[AccountPermissions.jsx:38] ----- render ----->", this.isStateChanged());
        let ad = this.props.all_delegates;
        let all_accounts = Object.keys(ad).map(k => [`["${ad[k]}","${k}"]`, k]);
        let action_buttons_class = "button" + (this.isStateChanged() ? "" : " disabled");

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Active Permissions</h3>
                    <PermissionsTable
                        permissions={this.state.active_permissions}
                        threshold={this.state.active_threshold}
                        accounts={all_accounts}
                        onAddRow={this.onAddRow.bind(this, this.ACTIVE)}
                        onRemoveRow={this.onRemoveRow.bind(this, this.ACTIVE)}
                        onThresholdChanged={this.onThresholdChanged.bind(this, this.ACTIVE)} />
                    <br/>
                    <h3>Owner Permissions</h3>
                    <PermissionsTable
                        permissions={this.state.owner_permissions}
                        threshold={this.state.owner_threshold}
                        accounts={all_accounts}
                        onAddRow={this.onAddRow.bind(this, this.OWNER)}
                        onRemoveRow={this.onRemoveRow.bind(this, this.OWNER)}
                        onThresholdChanged={this.onThresholdChanged.bind(this, this.OWNER)} />
                    <div className="actions clearfix">
                        <button className={action_buttons_class} onClick={this.onPublish.bind(this)}>Publish Changes</button>
                        <a href="#" className={action_buttons_class + " secondary"} onClick={this.onResetChanges.bind(this)}>Reset Changes</a>
                    </div>

                </div>
            </div>
        );
    }
}

export default AccountPermissions;
