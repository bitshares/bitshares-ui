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

class AccountVotingItems extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selected_item: null,
            item_name_input: "",
            items: this.props.items
        }
        this.onItemChange = this.onItemChange.bind(this);
        this.onItemAccountChange = this.onItemAccountChange.bind(this);
        this.onAddItem = this.onAddItem.bind(this);
        this.onRemoveItem = this.onRemoveItem.bind(this);
    }

    onItemChange(item_name_input) {
        this.setState({item_name_input});
    }

    onItemAccountChange(selected_item) {
        this.setState({selected_item});
    }

    onAddItem(item) {
        if(!item) return;
        this.state.items[item.get("id")] = item.get("id");
        let next_state = {
            selected_item: null,
            item_name_input: "",
            items: this.state.items
        };
        this.setState(next_state);
    }

    onRemoveItem(item_id) {
        delete this.state.items[item_id];
        this.setState({items: this.state.items});
    }

    render() {
        console.log("-- AccountVotingItems.render -->", this.state.items);

        let error = "";

        let cw = ["10%", "20%", "60%", "10%"];

        return (
            <BindToChainState.Wrapper {...this.state.items}>
                { (items) =>
                    <div>
                        <AccountSelector label="account.votes.add_witness_label"
                                         error={error}
                                         placeholder="New Witness Account"
                                         account={this.state.item_name_input}
                                         accountName={this.state.item_name_input}
                                         onChange={this.onItemChange}
                                         onAction={this.onAddItem}
                                         action_class={"button"}
                                         action_label="account.votes.add_witness"
                                         ref="item_selector"
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
                            {
                                _.pairs(items)
                                    .filter(e => e[1] && typeof(e[1]) === "object" && e[0].indexOf("1.2.") === 0)
                                    .sort((a,b) => b[1].get("name") < a[1].get("name"))
                                    .map(e => {
                                        return (<AccountItemRow account={e[1]} onRemoveItem={this.onRemoveItem}/>)
                                    })
                            }
                            </tbody>
                        </table>
                    </div>
                }
            </BindToChainState.Wrapper>
        );
    }

}

export default AccountVotingItems;
