import React from "react";
import AutocompleteInput from "../Forms/AutocompleteInput";
import Icon from "../Icon/Icon";

class PermissionsTable extends React.Component {

    constructor() {
        super();
        this.state = {add_mode: false}
    }

    addButtonClicked(e) {
        e.preventDefault();
        this.setState({add_mode: true});
    }

    cancelButtonClicked(e) {
        e.preventDefault();
        this.setState({add_mode: false});
    }

    saveButtonClicked(e) {
        e.preventDefault();
        let value = this.refs.select_account.value();
        if (!value) return;
        this.props.onAddRow("account", value, 10);
        this.setState({add_mode: false});
    }

    removeButtonClicked(key, e) {
        e.preventDefault();
        this.props.onRemoveRow(key);
    }

    render() {
        let rows = this.props.permissions.map(p => {
            return (
                <tr key={p}>
                    <td><Icon name="user"/></td>
                    <td>{p}</td>
                    <td>10</td>
                    <td><a href onClick={this.removeButtonClicked.bind(this, p)}><Icon name="cross-circle"/></a></td>
                </tr>
            );
        });
        let control_row = this.state.add_mode ? (
            <tr>
                <td><Icon name="user"/></td>
                <td><AutocompleteInput id="select_account" options={this.props.accounts} ref="select_account"/></td>
                <td>weight</td>
                <td>
                    <button className="button" onClick={this.saveButtonClicked.bind(this)}>Save</button>
                    <button className="button outline" onClick={this.cancelButtonClicked.bind(this)}>Cancel</button>
                </td>
            </tr>
        ) : (
            <tr>
                <td>
                    <button className="button" onClick={this.addButtonClicked.bind(this)}><Icon name="plus-circle"/></button>
                </td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        );


        return (
            <table className="table">
                <thead>
                <tr>
                    <th>Key</th>
                    <th>Address/Name</th>
                    <th>Weight</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {rows}
                {control_row}
                </tbody>
            </table>
        );
    }
}

export default PermissionsTable;
