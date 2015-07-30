import alt from "../alt-instance";
import utils from "../common/utils";
import api from "../api/accountApi";

class ChainActions {

    getAccount(name_or_id, subscription ) {

       /*
        let subscription = (account, result) => {
             console.log("sub result:", JSON.stringify(result, null, 2), name_or_id, JSON.stringify(account));


            api.getFullAccounts(null, name_or_id)
                .then(fullAccount => {
                    api.getHistory(fullAccount[0][1].account.id, 100).then(history => {

                        this.dispatch({
                            sub: true,
                            fullAccount: fullAccount[0][1],
                            history: history
                        });
                    });
                });
        };
    */
        console.log( "ChainActions.getAccount()" );

        return api.getFullAccounts( subscription /*subscription.bind(this, name_or_id)*/, name_or_id)
            .then(fullAccount => {
               console.log("result:", fullAccount);
                this.dispatch(fullAccount[0][1]);
            }).catch((error) => {
                console.log("Error in ChainActions.getAccount: ", error);
            });
    }
}

module.exports = alt.createActions(ChainActions);
