import React from "react";
import _ from "lodash";
import AccountSelector from "./AccountSelector";
import Translate from "react-translate-component";
import Immutable from "immutable";
import AccountImage from "./AccountImage";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from "../Utility/BindToChainState";

class AccountItemRow extends React.Component {
    static propTypes = {
        account: React.PropTypes.object.isRequired,
        onRemoveItem: React.PropTypes.func.isRequired
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.account !== this.props.account;
    }

    onRemoveItem(item_id){
        this.props.onRemoveItem(item_id);
    }

    render() {
        let {account, type} = this.props;
        let name = account.get("name");
        let item_id = account.get("id");

        let url = "";
        let votes = 0;
        if (type) {
            if (type === "witness") {
                let witness = ChainStore.getWitnessById(account.get("id"));
                url = witness ? witness.get("url") : url;
                votes = witness ? witness.get("total_votes") : votes;
            } else if (type === "committee") {
                let committee = ChainStore.getCommitteeMemberById(account.get("id"));
                url = committee ? committee.get("url") : url;
                votes = committee ? committee.get("total_votes") : votes;
            }
        }


        return (
            <tr key={name}>
                <td>
                    <AccountImage size={{height: 30, width: 30}} account={name}/>
                </td>
                <td>{name}</td>
                <td>{url}</td>
                <td><FormattedAsset amount={votes} asset="1.3.0" decimalOffset={5} /></td>
                <td>
                    <button className="button outline" onClick={this.onRemoveItem.bind(this, item_id)}>
                        <Translate content="account.votes.remove_witness"/></button>
                </td>
            </tr>
        );
    }
}

@BindToChainState({keep_updating: true})
class AccountsList extends React.Component {

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
        if(!this.props.items) return null;
        let item_rows = this.props.items.filter(i => {
            if (!i) return false;
            //if (this.state.item_name_input) return i.get("name").indexOf(this.state.item_name_input) !== -1;
            return true;
        }).sort((a,b) =>{
                 if( a.get("name") > b.get("name") ) return 1;
                 else if( a.get("name") < b.get("name") ) return -1;
                 return 0;
                 })
           .map(i => {
            return (<AccountItemRow account={i} type={this.props.type} onRemoveItem={this.props.onRemoveItem}/>)
           });

        let error = this.state.error;
        if(!error && this.state.selected_item && this.props.items.indexOf(this.state.selected_item) !== -1)
            error = "Account is already in the list";

        let cw = ["10%", "20%", "40%", "20%", "10%"];

        return (
            <div>
                <AccountSelector
                    style={{maxWidth: "600px"}}
                    label={this.props.label}
                    error={error}
                    placeholder={this.props.placeholder}
                    account={this.state.item_name_input}
                    accountName={this.state.item_name_input}
                    onChange={this.onItemChange}
                    onAccountChanged={this.onItemAccountChange}
                    onAction={this.onAddItem}
                    action_label="account.votes.add_witness"
                    tabIndex={this.props.tabIndex}
                 />
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{width: cw[0]}}></th>
                            <th style={{width: cw[1]}}><Translate content="account.votes.name"/></th>
                            <th style={{width: cw[2]}}><Translate content="account.votes.url"/></th>
                            <th style={{width: cw[3]}}><Translate content="account.votes.votes" /></th>
                            <th style={{width: cw[4]}}>ACTION</th>
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

export default AccountsList;
