import alt from "../alt-instance";
import utils from "../common/utils";
import api from "../api/accountApi";

class ChainActions {

    setBalance( balance ) {
       console.log( "set balance", balance );
       this.dispatch( balance );
    }

    getAccount(name_or_id ) {

        let subscription = (result) => {
             console.log(this);
             console.log("sub result:", JSON.stringify(result, null, 2) );

              if( result[0][0].id.split('.')[1] == 5 )
              {
                 /*
                 let acnt = this.getAccountByID( result[0][0].owner );
                 acnt.balances[result[0][0].asset_type] = result[0][0].balance;
                 console.log("acnt", JSON.stringify( acnt, null, 2 ) );
                 dispatch( acnt );
                 */
                 this.actions.setBalance( result[0][0] );
              }

        };
        console.log( "ChainActions.getAccount()" );

        return api.getFullAccounts( subscription.bind(this) /*subscription.bind(this, name_or_id)*/, name_or_id)
            .then(fullAccount => {
               console.log("result:", fullAccount);
                this.dispatch(fullAccount[0][1]);
            }).catch((error) => {
                console.log("Error in ChainActions.getAccount: ", error);
            });
    }
}

module.exports = alt.createActions(ChainActions);
