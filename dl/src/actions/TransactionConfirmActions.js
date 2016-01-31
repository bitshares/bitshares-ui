import alt from "alt-instance";
import { chain_config } from "@graphene/chain";

class TransactionConfirmActions {

    confirm(transaction) {
        this.dispatch({transaction})
    }

    broadcast(transaction) {
        this.dispatch();

        let broadcast_timeout = setTimeout(() => {
            this.actions.error("Your transaction has expired without being confirmed, please try again later.");
        }, chain_config.expire_in_secs * 2000);

        transaction.broadcast(() => this.actions.wasBroadcast()).then( (res)=> {
            clearTimeout(broadcast_timeout);
            this.actions.wasIncluded(res);
        }).catch( error => {
            console.error(error)
            clearTimeout(broadcast_timeout);
            // messages of length 1 are local exceptions (use the 1st line)
            // longer messages are remote API exceptions (use the 2nd line)
            let splitError = error.message.split( '\n' );
            let message = splitError[splitError.length === 1 ? 0 : 1];
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
