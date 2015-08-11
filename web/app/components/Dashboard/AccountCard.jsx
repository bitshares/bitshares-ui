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
                                   return ( <div className="grid-content no-overflow"><BalanceComponent balance={x}  /></div>) 
                                  } ).toArray()
           }
        }

        //DEBUG console.log( "props: ", this.props )
        //DEBUG console.log( "state: ", this.state )
        if( this.state.full_accounts.account )
           console.log( "account", this.state.full_accounts.account.toJS() )
        return (
                  <div className="grid-block card ">
                      <div className="grid-block shrink no-overflow">
                          <AccountImage account={name} size={{height: 64, width: 64}}/>
                      </div>
                      <div className="grid-block vertical no-overflow">
                          <Link to="account" params={{account_name: name}}>
                             <div className="grid-content card-divider"> <center>{name}</center> </div>
                          </Link>
                          <div className="grid-block ">
                             <div className="grid-content "/>
                             <div className="grid-block vertical card-section shrink">
                                {balances}
                             </div>
                          </div>
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
