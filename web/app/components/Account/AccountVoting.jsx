import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";
import VotesTable from "./VotesTable"

class AccountVoting extends React.Component {

    constructor() {
        super();
        this.state = { my_delegates: Immutable.List.of({name: "Alice"}, {name: "Bob"}) };
    }

    onAddRow(type, name) {
        console.log("[AccountVoting.jsx:26] ----- onAddRow ----->", type, name);
        let my_delegates = this.state.my_delegates.push({name});
        this.setState({my_delegates: my_delegates});
    }

    onRemoveRow(type, name) {
        let index = this.state.my_delegates.findIndex(i => i.name === name);
        if (index >= 0) {
            let my_delegates = this.state.my_delegates.delete(index);
            this.setState({my_delegates: my_delegates});
        }
    }

    render() {
        let ad = this.props.all_delegates;
        let all_delegates = Object.keys(ad).map(k => [`["${ad[k]}","${k}"]`, k]);

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Delegates</h3>
                    <VotesTable
                        selectedEntities={this.state.my_delegates}
                        allEntities={all_delegates}
                        onAddRow={this.onAddRow.bind(this, 1)}
                        onRemoveRow={this.onRemoveRow.bind(this, 1)}
                        />

                </div>
            </div>
        );
    }
}

export default AccountVoting;
