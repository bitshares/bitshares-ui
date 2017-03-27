import React from "react";
import {Link} from "react-router/es";
import AccountSelector from "./AccountSelector";
import Translate from "react-translate-component";
import AccountImage from "./AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Icon from "../Icon/Icon";
import PrivateKeyView from "components/PrivateKeyView";
import counterpart from "counterpart";
import utils from "common/utils";
import AddressIndex from "stores/AddressIndex";

class AccountPermissionRow extends React.Component {
    static propTypes = {
        account: React.PropTypes.object,
        pubkey: React.PropTypes.string,
        address: React.PropTypes.string,
        onRemoveItem: React.PropTypes.func.isRequired,
        weights: React.PropTypes.object
    };

    shouldComponentUpdate(nextProps) {
        return !utils.are_equal_shallow(nextProps, this.props);
    }

    _lookUpPubKeyForAddress(address) {
        var addresses = AddressIndex.getState().addresses;
        var pubkey = addresses.get(address);
        return pubkey;
    }

    render() {
        let name, item_id, name_or_key;
        let suffix = "_accounts";
        let pubKey = this.props.pubkey;

        if (this.props.account) {
            name = this.props.account.get("name");
            item_id = this.props.account.get("id");
            name_or_key = <Link to={`/account/${name}/permissions`}>{name}</Link>;
        } else if (pubKey) {
            name = item_id = this.props.pubkey;
            name_or_key = <PrivateKeyView pubkey={this.props.pubkey}>{this.props.pubkey}</PrivateKeyView>
            suffix = "_keys";
        } else if (this.props.address) {
            pubKey = this._lookUpPubKeyForAddress(this.props.address);
            item_id = this.props.address;
            name_or_key = !pubKey ? this.props.address : <PrivateKeyView pubkey={pubKey}>{pubKey}</PrivateKeyView>;
            suffix = "_addresses";
        }

        return (
            <tr key={name}>
                <td>
                { this.props.account ?
                    <AccountImage size={{height: 30, width: 30}} account={name}/>
                : pubKey ? (
                    <div className="account-image">
                        <PrivateKeyView pubkey={pubKey}>
                            <Icon name="key" size="4x"/>
                        </PrivateKeyView>
                    </div>)
                : null}
                </td>
                <td>{name_or_key}</td>
                <td>{this.props.weights[item_id]}</td>
                <td>
                    <button className="button outline" onClick={this.props.onRemoveItem.bind(this, item_id, suffix)}>
                        <Translate content="account.votes.remove_witness"/></button>
                </td>
            </tr>
        );
    }
}

class AccountPermissionsList extends React.Component {

    static propTypes = {
        accounts: ChainTypes.ChainObjectsList,
        onAddItem: React.PropTypes.func.isRequired,
        onRemoveItem: React.PropTypes.func.isRequired,
        validateAccount: React.PropTypes.func,
        label: React.PropTypes.string.isRequired, // a translation key for the label,
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        weights: React.PropTypes.object // weights: hash of {account id -> weight}
    };

    constructor(props) {
        super(props);
        this.state = {
            selected_item: null,
            item_name_input: "",
            weight_input: "",
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

    onWeightChanged(event) {
        let value = event.target.value.trim();
        this.setState({weight_input: parseInt(value)});
    }

    onAddItem(item) {
        if(!item) return;
        let next_state = {
            selected_item: null,
            item_name_input: "",
            weight_input: "",
            error: null
        };
        this.setState(next_state);
        let item_value = typeof(item) === "string" ? item : item.get("id");
        this.props.onAddItem(item_value, this.state.weight_input);
    }

    onWeightKeyDown(event) {
        if (event.keyCode === 13 && this.state.weight_input && this.state.selected_item)
            this.onAddItem(this.state.selected_item);
    }

    render() {
        var key = 0
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
            return (<AccountPermissionRow key={key++} account={i} weights={this.props.weights} onRemoveItem={this.props.onRemoveItem}/>)
           });

        let key_rows = this.props.keys.map(k => {
            return (<AccountPermissionRow key={key++} pubkey={k} weights={this.props.weights} onRemoveItem={this.props.onRemoveItem}/>)
        });

        let address_rows = this.props.addresses.map(k => {
            return (<AccountPermissionRow key={key++} address={k} weights={this.props.weights} onRemoveItem={this.props.onRemoveItem}/>)
        });

        let error = this.state.error;
        if(!error && this.state.selected_item && this.props.accounts.indexOf(this.state.selected_item) !== -1)
            error = counterpart.translate("account.perm.warning3");
        if(!error && this.state.item_name_input && this.props.keys.indexOf(this.state.item_name_input) !== -1)
            error = counterpart.translate("account.perm.warning4");

        let cw = ["10%", "70%", "30%", "10%"];

        return (
            <div>
                <AccountSelector
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
                    allowPubKey={true}
                    disableActionButton={!this.state.weight_input}
                    allowUppercase={true}
                >
                    <input value={this.state.weight_input}
                           onChange={this.onWeightChanged.bind(this)}
                           className="weight-input"
                           type="number"
                           autoComplete="off"
                           placeholder={counterpart.translate("account.perm.weight")}
                           onKeyDown={this.onWeightKeyDown.bind(this)}
                           tabIndex={this.props.tabIndex + 1}/>
                </AccountSelector>
                <table className="table">
                    <thead>
                    <tr>
                        <th style={{width: cw[0]}}></th>
                        <th style={{width: cw[1]}}><Translate content="account.perm.acct_or_key" /></th>
                        <th style={{width: cw[2]}}><Translate content="account.perm.weight" /></th>
                        <th style={{width: cw[3]}}><Translate content="account.perm.action" /></th>
                    </tr>
                    </thead>
                    <tbody>
                    {account_rows}
                    {key_rows}
                    {address_rows}
                    </tbody>
                </table>
            </div>
        );
    }

}

export default BindToChainState(AccountPermissionsList, {keep_updating: true});
