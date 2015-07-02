import React from "react";
import AutocompleteInput from "../Forms/AutocompleteInput";
import Icon from "../Icon/Icon";
import ReactTooltip from "react-tooltip";

class VotesTable extends React.Component {

    constructor() {
        super();
        this.state = {add_mode: false};
        this.onAdd = this.onAdd.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);
    }

    componentDidUpdate() {
        if(this.refs.select_entity) this.refs.select_entity.focus();
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
        let name = this.refs.select_entity.value();
        if (!name) return;
        this.props.onAddRow(name);
        this.setState({add_mode: false});
    }

    onRemove(name, e) {
        e.preventDefault();
        this.props.onRemoveRow(name);
    }

    render() {
        let cw = ["30%", "30%", "10%%", "30%"];
        let rows = this.props.selectedEntities.map(e => {
            return (
                <tr key={e.name}>
                    <td style={{width: cw[0]}}>{e.name}</td>
                    <td style={{width: cw[1]}}>{e.info}</td>
                    <td style={{width: cw[2]}}>{e.support}</td>
                    <td style={{width: cw[3]}}>
                        <a href onClick={this.onRemove.bind(this, e.name)} data-tip="Delete" data-place="right" data-position="{'top': -10, 'left': -20}">
                            <Icon name="cross-circle"/>
                        </a>
                    </td>
                </tr>
            );
        });
        let control_row = this.state.add_mode ? (
            <tr className="control-row">
                <td style={{width: cw[0]}}><AutocompleteInput id="select_entity" options={this.props.allEntities} ref="select_entity" onEnter={this.onSave}/></td>
                <td style={{width: cw[1]}}>
                    <button className="button" onClick={this.onSave}>Add</button>
                    <button className="button secondary" onClick={this.onCancel}>Cancel</button>
                </td>
                <td style={{width: cw[2]}}></td>
                <td style={{width: cw[3]}}></td>
            </tr>
        ) : (
            <tr className="control-row">
                <td style={{width: cw[0], paddingLeft: 0}}><a href className="button outline" onClick={this.onAdd}>Add</a></td>
                <td style={{width: cw[1]}}></td>
                <td style={{width: cw[2]}}></td>
                <td style={{width: cw[3]}}></td>
            </tr>
        );

        return (
            <div>
                <table className="table">
                    <thead>
                    <tr>
                        <th style={{width: cw[0]}}>Name</th>
                        <th style={{width: cw[1]}}>Info</th>
                        <th style={{width: cw[2]}}>Support</th>
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

export default VotesTable;
