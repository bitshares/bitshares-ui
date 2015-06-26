import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";

class AccountVoting extends React.Component {

    constructor() {
        super();
        this.state = { my_delegates: Immutable.List.of("Alice","Bob") }
    }

    handleAddMyDelegate(e) {
        e.preventDefault();
        let value = this.refs.select_delegate.value();
        if(!value) return;
        this.state.my_delegates = this.state.my_delegates.push(value);
        this.setState({my_delegates: this.state.my_delegates});
        this.refs.select_delegate.clear();
    }

    render() {
        let ad = this.props.all_delegates;
        let all_delegates = Object.keys(ad).map(k => [`["${ad[k]}","${k}"]`, k]);

        let my_delegates_rows = this.state.my_delegates.map( d => {
            return (
                <tr key={d}>
                    <td>{d}</td>
                    <td>some info</td>
                    <td>10%</td>
                </tr>
            );
        });

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Delegates</h3>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Delegate Name</th>
                            <th>Delegate Info</th>
                            <th>Support</th>
                        </tr>
                        </thead>
                        <tbody>
                            {my_delegates_rows}
                        </tbody>
                    </table>
                    <div className="actions">
                        <div className="medium-3">
                            <div className="float-right"><a href="#" className="button" onClick={this.handleAddMyDelegate.bind(this)}>Add</a></div>
                            <AutocompleteInput id="select_delegate" options={all_delegates} ref="select_delegate"/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default AccountVoting;
