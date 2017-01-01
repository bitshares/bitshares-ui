import React from "react";
import AccountSelector from "./AccountSelector";
import Translate from "react-translate-component";
import Immutable from "immutable";
import AccountImage from "./AccountImage";
import {ChainStore} from "graphenejs-lib";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from "../Utility/BindToChainState";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import counterpart from "counterpart";

function getWitnessOrCommittee(type, acct) {
    let url = "", votes = 0, account;
    if (type === "witness") {
        account = ChainStore.getWitnessById(acct.get("id"));
    } else if (type === "committee") {
        account = ChainStore.getCommitteeMemberById(acct.get("id"));
    }

    url = account ? account.get("url") : url;
    votes = account ? account.get("total_votes") : votes;

    return {
        url,
        votes
    };
}

class AccountItemRow extends React.Component {
    static propTypes = {
        account: React.PropTypes.object.isRequired,
        onAction: React.PropTypes.func.isRequired
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.account !== this.props.account;
    }

    onAction(item_id){
        this.props.onAction(item_id);
    }

    render() {
        let {account, type} = this.props;
        let name = account.get("name");
        let item_id = account.get("id");

        let {url, votes} = getWitnessOrCommittee(type, account);

        let link = url && url.length > 0 && url.indexOf("http") === -1 ? "http://" + url : url;

        return (
            <tr>
                <td>
                    <AccountImage size={{height: 30, width: 30}} account={name}/>
                </td>
                <td><LinkToAccountById account={account.get("id")} /></td>
                <td><a href={link} target="_blank">{url.length < 45 ? url : url.substr(0, 45) + "..."}</a></td>
                <td><FormattedAsset amount={votes} asset="1.3.0" decimalOffset={5} /></td>
                <td>
                    <button className="button outline" onClick={this.onAction.bind(this, item_id)}>
                        <Translate content={`account.votes.${this.props.action}_witness`}/></button>
                </td>
            </tr>
        );
    }
}

class AccountsList extends React.Component {

    static propTypes = {
        items: ChainTypes.ChainObjectsList,
        onAddItem: React.PropTypes.func.isRequired,
        onRemoveItem: React.PropTypes.func.isRequired,
        validateAccount: React.PropTypes.func,
        label: React.PropTypes.string.isRequired, // a translation key for the label,
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        action: React.PropTypes.string,
        withSelector: React.PropTypes.bool,
    };

    static defaultProps = {
        action: "remove",
        withSelector: true
    };

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
        })
        .sort((a,b) =>{
            let {votes: a_votes} = getWitnessOrCommittee(this.props.type, a);
            let {votes: b_votes} = getWitnessOrCommittee(this.props.type, b);
            if (a_votes !== b_votes) {
                return b_votes - a_votes;
            }
            else if( a.get("name") > b.get("name") ) {
                return 1;
            }
            else if ( a.get("name") < b.get("name") ) {
                return -1;
            } else {
                return 0;
            }
        })
        .map(i => {
            return (
                <AccountItemRow
                    key={i.get("name")}
                    account={i}
                    type={this.props.type}
                    onAction={this.props.action === "add" ? this.props.onAddItem : this.props.onRemoveItem}
                    isSelected={this.props.items.indexOf(i) !== -1}
                    action={this.props.action}
                />
            );
        });

        let error = this.state.error;
        if(!error && this.state.selected_item && this.props.items.indexOf(this.state.selected_item) !== -1) {
            error = counterpart.translate("account.votes.already");
        }

        let cw = ["10%", "20%", "40%", "20%", "10%"];

        return (
            <div>
                {this.props.withSelector ?
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
                /> : null}
                {this.props.title && item_rows.length ? <h4>{this.props.title}</h4> : null}
                {item_rows.length ? (
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{width: cw[0]}}></th>
                            <th style={{width: cw[1]}}><Translate content="account.votes.name"/></th>
                            <th style={{width: cw[2]}}><Translate content="account.votes.url"/></th>
                            <th style={{width: cw[3]}}><Translate content="account.votes.votes" /></th>
                            <th style={{width: cw[4]}}><Translate content="account.perm.action" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {item_rows}
                    </tbody>
                </table>) : null}
            </div>
        );
    }

}

export default BindToChainState(AccountsList, {keep_updating: true});
