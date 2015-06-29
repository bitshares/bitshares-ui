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
        let name = this.refs.select_account.value();
        if (!name) return;
        console.log("[PermissionsTable.jsx:26] ----- saveButtonClicked ----->", React.findDOMNode(this.refs.weight).value);
        let weight = React.findDOMNode(this.refs.weight).value;
        if (!weight) return;
        this.props.onAddRow(name, weight);
        this.setState({add_mode: false});
    }

    removeButtonClicked(name, e) {
        e.preventDefault();
        this.props.onRemoveRow(name);
    }

    render() {
        let rows = this.props.permissions.map(p => {
            return (
                <tr key={p.name}>
                    <td>{p.type === "account" ? <Icon name="user"/> : <Icon name="key"/>}</td>
                    <td>{p.name}</td>
                    <td>{p.weight}</td>
                    <td><a href onClick={this.removeButtonClicked.bind(this, p.name)}><Icon name="cross-circle"/></a></td>
                </tr>
            );
        });
        let control_row = this.state.add_mode ? (
            <tr>
                <td></td>
                <td><AutocompleteInput id="select_account" options={this.props.accounts} ref="select_account"/></td>
                <td><input type="number" ref="weight"/></td>
                <td>
                    <button className="button outline" onClick={this.saveButtonClicked.bind(this)}>Save</button>
                    <button className="button outline" onClick={this.cancelButtonClicked.bind(this)}>Cancel</button>
                </td>
            </tr>
        ) : null;


        return (
            <div>
                <table className="table">
                    <thead>
                    <tr>
                        <th>Type</th>
                        <th>Key/Name</th>
                        <th>Weight</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows}
                    {control_row}
                    </tbody>
                </table>
                {   this.state.add_mode ? null : (
                    <div className="actions">
                        <a href className="button outline" onClick={this.addButtonClicked.bind(this)}>Add Permission</a>
                    </div>)
                }
            </div>
        );
    }
}

export default PermissionsTable;
