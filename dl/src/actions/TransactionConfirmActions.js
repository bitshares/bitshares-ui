import alt from "alt-instance";
import config from "../chain/config.coffee";

class TransactionConfirmActions {

    confirm(transaction) {
        this.dispatch({transaction})
    }

    broadcast(transaction) {
        this.dispatch();

        let broadcast_timeout = setTimeout(() => {
            this.actions.error("Your transaction has expired without being confirmed, please try again later.");
        }, config.expire_in_secs * 2000);

        transaction.broadcast(() => this.actions.wasBroadcast()).then( (res)=> {
            clearTimeout(broadcast_timeout);
            this.actions.wasIncluded(res);
        }).catch( error => {
            console.error(error)
            clearTimeout(broadcast_timeout);
            let splitError = error.message.split("\n");

            let message = splitError.length > 1 ? splitError[0] + splitError[1] : splitError[0];
            this.actions.error(message);
        });
    }

    wasBroadcast(res){
        this.dispatch(res);
    }

    wasIncluded(res){
        this.dispatch(res);
    }

    close() {
        this.dispatch();
    }

    error(msg) {
        this.dispatch({error: msg});
    }

}

export default alt.createActions(TransactionConfirmActions)
