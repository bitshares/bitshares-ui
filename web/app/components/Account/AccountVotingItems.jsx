import React from "react";
import _ from "lodash";
import AccountSelector from "./AccountSelector";
import Translate from "react-translate-component";
import Immutable from "immutable";
import AccountImage from "./AccountImage";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

class AccountItemRow extends React.Component {
    static propTypes = {
        account: React.PropTypes.object.isRequired,
        onRemoveItem: React.PropTypes.func.isRequired
    }
    onRemoveItem(item_id){
        this.props.onRemoveItem(item_id);
    }
    render() {
        let name = this.props.account.get("name");
        let item_id = this.props.account.get("id");
        let url = "";
        return (
            <tr key={name}>
                <td>
                    <AccountImage size={{height: 30, width: 30}} account={name}/>
                </td>
                <td>{name}</td>
                <td>{url}</td>
                <td>
                    <button className="button outline" onClick={this.onRemoveItem.bind(this, item_id)}>
                        <Translate content="account.votes.remove_witness"/></button>
                </td>
            </tr>
        );
    }
}

@BindToChainState()
class AccountVotingItems extends React.Component {

    static propTypes = {
        items: ChainTypes.ChainObjectsList,
        onAddItem: React.PropTypes.func.isRequired,
        onRemoveItem: React.PropTypes.func.isRequired,
        validateAccount: React.PropTypes.func,
        label: React.PropTypes.string.isRequired, // a translation key for the label,
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        tabIndex: React.PropTypes.number // tabindex property to be passed to input tag
    }

    constructor(props) {
        super(props);
        this.state = {
            selected_item: null,
            item_name_input: "",
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
            console.log("-- AccountVotingItems.onItemAccountChange -->", res);
            if(res === null) return;
            if(typeof(res) === "string") this.setState({error: res});
            else res.then(error => this.setState({error: error}));
        }
    }

    onAddItem(item) {
        if(!item) return;
        let next_state = {
            selected_item: null,
            item_name_input: "",
            error: null
        };
        this.setState(next_state);
        this.props.onAddItem(item.get("id"));
    }

    render() {
        let item_rows = this.props.items.filter(i => i).sort((a,b) => a.get("name") > b.get("name")).map(i => {
            return (<AccountItemRow account={i} onRemoveItem={this.props.onRemoveItem}/>)
        });

        let error = this.state.error;
        if(!error && this.state.selected_item && this.props.items.includes(this.state.selected_item))
            error = "Account is already in the list";

        //if(!error && this.state.selected_item && this.props.validateAccount)
        //    error = this.props.validateAccount(this.state.selected_item);

        let cw = ["10%", "20%", "60%", "10%"];

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
                                 tabIndex={this.props.tabIndex}/>
                <table className="table">
                    <thead>
                    <tr>
                        <th style={{width: cw[0]}}></th>
                        <th style={{width: cw[1]}}><Translate content="account.votes.name"/></th>
                        <th style={{width: cw[2]}}><Translate content="account.votes.url"/></th>
                        <th style={{width: cw[3]}}>ACTION</th>
                    </tr>
                    </thead>
                    <tbody>
                    {item_rows}
                    </tbody>
                </table>
            </div>
        );
    }

}

export default AccountVotingItems;
