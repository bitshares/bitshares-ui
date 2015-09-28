import React, {Component, PropTypes} from "react";
import AccountStore from "stores/AccountStore"
import ChainTypes from "components/Utility/ChainTypes"
import AccountSelect from "components/Forms/AccountSelect"
import BindToChainState from "components/Utility/BindToChainState"

@BindToChainState({keep_updating: true})
export default class MyAccounts extends Component {

    static propTypes = {
        accounts: ChainTypes.ChainAccountsList.isRequired,
        onChange: React.PropTypes.func.isRequired
    }
    
    render() {
        var account_names = this.props.accounts
            .filter( account => !!account )
            .filter( account => AccountStore.getMyAuthorityForAccount(account) === "full" )
            .map( account => account.get("name") ).sort()
        
        return <span>
            <AccountSelect onChange={this.onAccountSelect.bind(this)}
                account_names={account_names} center={true}/>
        </span>
    }
    
    onAccountSelect(account_name) {
        this.props.onChange(account_name)
    }

}