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
        let weight = React.findDOMNode(this.refs.weight).value;
        if (!weight) return;
        this.props.onAddRow(name, weight);
        this.setState({add_mode: false});
    }

    removeButtonClicked(name, e) {
        e.preventDefault();
        this.props.onRemoveRow(name);
    }

    thresholdChanged(e) {
        let threshold = React.findDOMNode(this.refs.threshold).value;
        this.props.onThresholdChanged(threshold);
    }

    render() {
        let cw = ["16%", "50%", "17%%", "17%"];
        let rows = this.props.permissions.map(p => {
            return (
                <tr key={p.name}>
                    <td style={{width: cw[0]}}>{p.type === "account" ? <Icon name="user"/> : <Icon name="key"/>}</td>
                    <td style={{width: cw[1]}}>{p.name}</td>
                    <td style={{width: cw[2]}}>{p.weight}</td>
                    <td style={{width: cw[3]}}><a href onClick={this.removeButtonClicked.bind(this, p.name)}><Icon name="cross-circle"/></a></td>
                </tr>
            );
        });
        let control_row = this.state.add_mode ? (
            <tr className="control-row">
                <td style={{width: cw[0]}}></td>
                <td style={{width: cw[1]}}><AutocompleteInput style={{width: "15rem"}} id="select_account" options={this.props.accounts} ref="select_account"/></td>
                <td style={{width: cw[2]}}><input type="number" style={{width: "4rem"}} ref="weight"/></td>
                <td style={{width: cw[3]}}>
                    <button className="button" onClick={this.saveButtonClicked.bind(this)}>Add</button>
                    <button className="button secondary" onClick={this.cancelButtonClicked.bind(this)}>Cancel</button>
                </td>
            </tr>
        ) : (
            <tr className="control-row">
                <td style={{width: cw[0]}}><a href className="button outline" onClick={this.addButtonClicked.bind(this)}>Add Permission</a></td>
                <td style={{width: cw[1]}} className="text-right"><label>Threshold</label></td>
                <td style={{width: cw[2]}}><input value={this.props.threshold} style={{width: "4rem"}} type="number" size="4" maxlength="4" ref="threshold" onChange={this.thresholdChanged.bind(this)} /></td>
                <td style={{width: cw[3]}}></td>
            </tr>
        );

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
            </div>
        );
    }
}

export default PermissionsTable;
