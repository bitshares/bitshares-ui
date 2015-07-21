import React from "react";
import {PropTypes} from "react";
import AutocompleteInput from "../Forms/AutocompleteInput";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";

class PermissionsTable extends React.Component {

    constructor() {
        super();
        this.state = {add_mode: false};
        this.onAdd = this.onAdd.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onThresholdChanged = this.onThresholdChanged.bind(this);
    }

    componentDidUpdate() {
        if(this.refs.select_account) this.refs.select_account.focus();
    }

    onAdd(e) {
        e.preventDefault();
        this.setState({add_mode: true});
    }

    onCancel(e) {
        e.preventDefault();
        this.setState({add_mode: false});
    }

    onSave(e) {
        e.preventDefault();
        let name = this.refs.select_account.value();
        if (!name) return;
        let weight = React.findDOMNode(this.refs.weight).value;
        if (!weight) return;
        this.props.onAddRow(name, weight);
        this.setState({add_mode: false});
    }

    onRemove(name, e) {
        e.preventDefault();
        this.props.onRemoveRow(name);
    }

    onThresholdChanged(e) {
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
                    <td style={{width: cw[3]}}>
                        <a href onClick={this.onRemove.bind(this, p.name)} data-tip="Delete" data-place="right" data-position="{'top': -10, 'left': -20}">
                            <Icon name="cross-circle"/>
                        </a>
                    </td>
                </tr>
            );
        });
        let control_row = this.state.add_mode ? (
            <tr className="control-row">
                <td style={{width: cw[0]}}></td>
                <td style={{width: cw[1]}}><AutocompleteInput id="select_account" options={this.props.accounts} ref="select_account"/></td>
                <td colSpan="2">
                    <input type="number" style={{width: "4rem"}} ref="weight"/>
                    <button className="button" onClick={this.onSave}><Translate content="account.perm.confirm_add" /></button>
                    <button className="button secondary" onClick={this.onCancel}><Translate content="account.perm.cancel" /></button>
                </td>
            </tr>
        ) : (
            <tr className="control-row">
                <td style={{width: cw[0], paddingLeft: 0}}><a href className="button outline" onClick={this.onAdd}><Translate content="account.perm.add" /></a></td>
                <td style={{width: cw[1]}} className="text-right"><label><Translate content="account.perm.threshold" /></label></td>
                <td style={{width: cw[2]}}><input value={this.props.threshold} style={{width: "4rem"}} type="number" size="4" maxLength="4" ref="threshold" onChange={this.onThresholdChanged} /></td>
                <td style={{width: cw[3]}}></td>
            </tr>
        );

        return (
            <div>
                <table className="table">
                    <thead>
                    <tr>
                        <th style={{width: cw[0]}}><Translate content="account.perm.type" /></th>
                        <th style={{width: cw[1]}}><Translate content="account.perm.key" /></th>
                        <th style={{width: cw[2]}}><Translate content="account.perm.weight" /></th>
                        <th style={{width: cw[3]}}></th>
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

PermissionsTable.defaultProps = {
    permissions: [],
    accounts: [],
    threshold: 90,
    onAddRow: function() {},
    onRemoveRow: function() {},
    onThresholdChanged: function() {}
};

PermissionsTable.propTypes = {
    permissions: PropTypes.object.isRequired,
    accounts: PropTypes.array.isRequired,
    threshold: PropTypes.number.isRequired,
    onAddRow: PropTypes.func.isRequired,
    onRemoveRow: PropTypes.func.isRequired,
    onThresholdChanged: PropTypes.func.isRequired
};

export default PermissionsTable;
