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
//       this.update()
    }

    render() {
        let name = "?"
        let balances = null
        if( this.state.full_accounts.account )
        {
           name = this.state.full_accounts.account.get('name')
           let abal = this.state.full_accounts.account.get('balances' )
           console.log( "render.. again more", abal  )
           if( abal )
           {
              console.log( "render ..", abal.toJS() ) 
              balances = abal.map( (x)=> { 
                                   console.log( "bal: ", x ); 
                                   return (<BalanceComponent balance={x}  />) 
                                  } ).toArray()
           }
        }

        console.log( "props: ", this.props )
        console.log( "state: ", this.state )
        if( this.state.full_accounts.account )
           console.log( "account", this.state.full_accounts.account.toJS() )
        return (
            <div style={{padding: "0.5em 0.5em"}} className="grid-content account-card">
                <div className="card">
                    <Link to="account" params={{account_name: name}}>
                        <div>
                            <AccountImage account={name} size={{height: 64, width: 64}}/>
                        </div>
                        <div className="card-divider">
                            {name}
                        </div>
                        <div className="card-section" style={{padding: 0}}>
                            {balances}
                        </div>
                    </Link>
                </div>
            </div>
        );
    }
}

/*
AccountCard.defaultProps = {
    account_name: null
};

AccountCard.propTypes = {
    account_name: PropTypes.string.isRequired,
    new: PropTypes.bool
};
*/

export default AccountCard;
