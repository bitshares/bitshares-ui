import React from "react";
import ChainComponent from "../Utility/ChainComponent"
import BalanceComponent from "../Utility/BalanceComponent"
import AccountImage from "../Account/AccountImage";
import {Link} from "react-router";

/**
 *  @brief displays the summary of a given account in a condenced view (for the dashboard)
 *
 *  This card has the following properties:
 *
 *  { full_accounts: { account: ${name_or_id} } }
 */
class AccountCard extends ChainComponent {
    constructor(props) 
    {
       super(props)
    }

    onCardClick(e) {
        e.preventDefault();
        let name = this.state.full_accounts.account.get('name');
        this.context.router.transitionTo("account", {account_name: name});
    }

    render() {
        let name = null;
        let balances = null;
        if( this.state.full_accounts.account )
        {
           name = this.state.full_accounts.account.get('name');
           let abal = this.state.full_accounts.account.get('balances' )
           if( abal )
           {
              balances = abal.map( x => <li><BalanceComponent balance={x}/></li>).toArray();
           }
        }

        return (
            <div className="grid-content account-card" onClick={this.onCardClick.bind(this)}>
                <div className="card">
                    <h4 className="text-center">{name}</h4>
                    <div className="card-content clearfix">
                        <div className="float-left">
                            <AccountImage account={name} size={{height: 64, width: 64}}/>
                        </div>
                        <ul className="balances">
                            {balances}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
}

AccountCard.contextTypes = {
    router: React.PropTypes.func.isRequired
};

AccountCard.propTypes = {
    full_accounts: React.PropTypes.object.isRequired
};

export default AccountCard;
