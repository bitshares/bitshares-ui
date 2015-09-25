import React from "react";
import {PropTypes} from "react";
import AutocompleteInput from "../Forms/AutocompleteInput";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";



/**
 *  Displays a permissions table and allows the user to make changes.
 */
@BindToChainState({keep_updating: true})
class PermissionsTable extends React.Component {

    static propTypes = {
      authority: React.PropTypes.object, /// { items : [ ["name|key", weight], threshold: t }
      onChange: React.PropTypes.func /// called any time authority changes
    }

    constructor( props ) {
        super( props );
        this.state = {
          authority : props.authority
        };

        this.onAdd = this.onAdd.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.onThresholdChanged = this.onThresholdChanged.bind(this);
    }

    componentDidUpdate() {
        if(this.refs.select_account) this.refs.select_account.focus();
    }

    onAdd() {
        let new_items = this.state.authority.items.slice(0);
        new_items.push( ["",1] );
        this.setState({ authority:{ items: new_items } });
    }

    onRemove(row) {
        let new_items = this.state.authority.items.slice(0);
        new_items.splice(row,1);
        this.setState({ authority:{ items: new_items } });
    }

    onThresholdChanged(e) {
        this.props.onThresholdChanged(threshold);
    }

    render() {
        let cw = ["16%", "50%", "17%%", "17%"];
        let rows = this.props.permissions.map(p => {
            return (
                <tr key={p.name}>
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
                    &nbsp; &nbsp;
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

export default PermissionsTable;
