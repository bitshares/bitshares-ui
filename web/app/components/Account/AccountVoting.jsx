import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";
import VotesTable from "./VotesTable"
import VoteActions from "actions/VoteActions"

class AccountVoting extends React.Component {

    constructor() {
        super();
        this.initial_data = {
            my_delegates: Immutable.List.of({name: "Alice", info: "Some delegate description", support: "12%"}, {name: "Bob", info: "Some another delegate description", support: "10%"}),
            my_witnesses: Immutable.List.of({name: "Node 1", info: "Some witness description", support: "12%"}, {name: "Node 2", info: "Some another witness description", support: "10%"}),
            my_budget_items: Immutable.List.of({name: "budget1", info: "Some budget item description", support: "12%"}, {name: "Node 2", info: "Some another budget description", support: "10%"})
        };
        this.state = this.getDefaultState();
    }

    getDefaultState() {
        return {
            my_delegates: this.initial_data.my_delegates,
            my_witnesses: this.initial_data.my_witnesses,
            my_budget_items: this.initial_data.my_witnesses
        };
    }

    isStateChanged() {
        return  this.state.my_delegates !== this.initial_data.my_delegates ||
                this.state.my_witnesses !== this.initial_data.my_witnesses ||
                this.state.my_budget_items !== this.initial_data.my_budget_items;
    }

    onAddRow(state_key, name) {
        let data = {}; data[state_key] = this.state[state_key].push({name});
        this.setState(data);
    }

    onRemoveRow(state_key, name) {
        let index = this.state[state_key].findIndex(i => i.name === name);
        if (index >= 0) {
            let data = {}; data[state_key] = this.state[state_key].delete(index);
            this.setState(data);
        }
    }

    onPublish() {
        console.log("[AccountVoting.jsx:49] ----- onPublish ----->");
    }

    onResetChanges(e) {
        e.preventDefault();
        this.setState(this.getDefaultState());
    }

    render() {
        let ad = this.props.all_delegates;
        let all_delegates = Object.keys(ad).map(k => [`["${ad[k]}","${k}"]`, k]);
        let all_witnesses = all_delegates;
        let all_budget_items = all_delegates;
        let action_buttons_class = "button" + (this.isStateChanged() ? "" : " disabled");

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Voting Proxy Account</h3>

                </div>
                <div className="content-block">
                    <h3>Delegates</h3>
                    <VotesTable
                        selectedEntities={this.state.my_delegates}
                        allEntities={all_delegates}
                        onAddRow={this.onAddRow.bind(this, "my_delegates")}
                        onRemoveRow={this.onRemoveRow.bind(this, "my_delegates")} />
                </div>
                <div className="content-block">
                    <h3>Witnesses</h3>
                    <VotesTable
                        selectedEntities={this.state.my_witnesses}
                        allEntities={all_witnesses}
                        onAddRow={this.onAddRow.bind(this, "my_witnesses")}
                        onRemoveRow={this.onRemoveRow.bind(this, "my_witnesses")} />
                </div>
                <div className="content-block">
                    <h3>Budget Items</h3>
                    <VotesTable
                        selectedEntities={this.state.my_budget_items}
                        allEntities={all_budget_items}
                        onAddRow={this.onAddRow.bind(this, "my_budget_items")}
                        onRemoveRow={this.onRemoveRow.bind(this, "my_budget_items")} />
                </div>
                <div className="content-block">
                    <div className="actions clearfix">
                        <button className={action_buttons_class} onClick={this.onPublish.bind(this)}>Publish Changes</button>
                        <a href="#" className={action_buttons_class + " secondary"} onClick={this.onResetChanges.bind(this)}>Reset Changes</a>
                    </div>
                </div>
            </div>
        );
    }
}

export default AccountVoting;
