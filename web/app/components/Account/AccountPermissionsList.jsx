import React from "react";
import _ from "lodash";
import AccountSelector from "./AccountSelector";
import Translate from "react-translate-component";
import Immutable from "immutable";
import AccountImage from "./AccountImage";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Icon from "../Icon/Icon";

class AccountPermissionRow extends React.Component {
    static propTypes = {
        account: React.PropTypes.object,
        pubkey: React.PropTypes.string,
        onRemoveItem: React.PropTypes.func.isRequired,
        thresholds: React.PropTypes.object
    }
    onRemoveItem(item_id){
        this.props.onRemoveItem(item_id);
    }
    render() {
        let name, item_id;
        if (this.props.account) {
            name = this.props.account.get("name");
            item_id = this.props.account.get("id");
        } else {
            name = item_id = this.props.pubkey;
        }
        return (
            <tr key={name}>
                <td>
                    { this.props.account ?
                    <AccountImage size={{height: 30, width: 30}} account={name}/>
                    : <div className="account-image"><Icon name="key" size="1x"/></div>
                    }
                </td>
                <td>{name}</td>
                <td>{this.props.thresholds[item_id]}</td>
                <td>
                    <button className="button outline" onClick={this.onRemoveItem.bind(this, item_id)}>
                        <Translate content="account.votes.remove_witness"/></button>
                </td>
            </tr>
        );
    }
}

@BindToChainState({keep_updating: true})
class AccountPermissionsList extends React.Component {

    static propTypes = {
        accounts: ChainTypes.ChainObjectsList,
        onAddItem: React.PropTypes.func.isRequired,
        onRemoveItem: React.PropTypes.func.isRequired,
        validateAccount: React.PropTypes.func,
        label: React.PropTypes.string.isRequired, // a translation key for the label,
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        thresholds: React.PropTypes.object // thresholds: hash of {account id -> threshold}
    }

    constructor(props) {
        super(props);
        this.state = {
            selected_item: null,
            item_name_input: "",
            threshold_input: "",
            error: null
        }
        this.onItemChange = this.onItemChange.bind(this);
        this.onItemAccountChange = this.onItemAccountChange.bind(this);
        this.onAddItem = this.onAddItem.bind(this);
    }

    onItemChange(item_name_input) {
        this.setState({item_name_input});
    }

    onItemAccountChange(selected_item) {
        this.setState({selected_item, error: null});
        if(selected_item && this.props.validateAccount) {
            let res = this.props.validateAccount(selected_item);
            if(res === null) return;
            if(typeof(res) === "string") this.setState({error: res});
            else res.then(error => this.setState({error: error}));
        }
    }

    onThresholdChanged(event) {
        let value = event.target.value.trim();
        this.setState({threshold_input: value});
    }

    onAddItem(item) {
        if(!item) return;
        let next_state = {
            selected_item: null,
            item_name_input: "",
            threshold_input: "",
            error: null
        };
        this.setState(next_state);
        let item_value = typeof(item) === "string" ? item : item.get("id");
        this.props.onAddItem(item_value, this.state.threshold_input);
    }

    onThresholdKeyDown(event) {
        if (event.keyCode === 13 && this.state.threshold_input && this.state.selected_item)
            this.onAddItem(this.state.selected_item);
    }

    render() {
        let account_rows = this.props.accounts.filter(i => {
            if (!i) return false;
            //if (this.state.item_name_input) return i.get("name").indexOf(this.state.item_name_input) !== -1;
            return true;
        }).sort((a,b) =>{
                 if( a.get("name") > b.get("name") ) return 1;
                 else if( a.get("name") < b.get("name") ) return -1;
                 return 0;
                 })
           .map(i => {
            return (<AccountPermissionRow account={i} thresholds={this.props.thresholds} onRemoveItem={this.props.onRemoveItem}/>)
           });

        let key_rows = this.props.keys.map(k => {
            return (<AccountPermissionRow pubkey={k} thresholds={this.props.thresholds} onRemoveItem={this.props.onRemoveItem}/>)
        });

        let error = this.state.error;
        if(!error && this.state.selected_item && this.props.accounts.indexOf(this.state.selected_item) !== -1)
            error = "Account is already in the list";
        if(!error && this.state.item_name_input && this.props.keys.indexOf(this.state.item_name_input) !== -1)
            error = "Key is already in the list";

        let cw = ["10%", "70%", "30%", "10%"];

        return (
            <div>
                <AccountSelector label={this.props.label}
                                 error={error}
                                 placeholder={this.props.placeholder}
                                 account={this.state.item_name_input}
                                 accountName={this.state.item_name_input}
                                 onChange={this.onItemChange}
                                 onAccountChanged={this.onItemAccountChange}
                                 onAction={this.onAddItem}
                                 action_label="account.votes.add_witness"
                                 tabIndex={this.props.tabIndex}
                                 allowPubKey={true}
                                 disableActionButton={!this.state.threshold_input}>
                    <input value={this.state.threshold_input}
                           onChange={this.onThresholdChanged.bind(this)}
                           className="threshold-input"
                           type="number"
                           placeholder="Threshold"
                           onKeyDown={this.onThresholdKeyDown.bind(this)}
                           tabIndex={this.props.tabIndex + 1}/>
                </AccountSelector>
                <table className="table">
                    <thead>
                    <tr>
                        <th style={{width: cw[0]}}></th>
                        <th style={{width: cw[1]}}>Account/Key</th>
                        <th style={{width: cw[2]}}>Threshold</th>
                        <th style={{width: cw[3]}}>ACTION</th>
                    </tr>
                    </thead>
                    <tbody>
                    {account_rows}
                    {key_rows}
                    </tbody>
                </table>
            </div>
        );
    }

}

export default AccountPermissionsList;
