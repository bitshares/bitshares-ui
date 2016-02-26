import alt from "alt-instance";
import { chain_config } from "@graphene/chain";

class TransactionConfirmActions {

    confirm(transaction) {
        this.dispatch({transaction})
    }

    broadcast(transaction) {
        this.dispatch();

        if (transaction.type === "blind") return transaction.broadcast();

        let broadcast_timeout = setTimeout(() => {
            this.actions.error("Your transaction has expired without being confirmed, please try again later.");
        }, chain_config.expire_in_secs * 2000);
        
        let tr_resolve = transaction.__resolve
        let cb = transaction.__broadcast_confirmed_callback
        
        // broadcast_confirmed_callback (optional) will save the receipts and backup the wallet
        (cb ? cb() : Promise.resolve())
        .then(()=> transaction.broadcast(() =>
            this.actions.wasBroadcast())
            .then((res)=> {
                clearTimeout(broadcast_timeout);
                this.actions.wasIncluded(res);
            })
        )
        .then((res)=> tr_resolve ? tr_resolve(res) : res)
        .catch( error => {
            console.error(error)
            if(tr_promise)
                tr_promise.reject(error)
            
            clearTimeout(broadcast_timeout);
            // messages of length 1 are local exceptions (use the 1st line)
            // longer messages are remote API exceptions (use the 2nd line)
            let splitError = error.message.split( '\n' );
            let message = splitError[splitError.length === 1 ? 0 : 1];
            this.actions.error(message);
        })
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

    confirmBlind(transaction) {
        console.log('confirmBlind')
        this.dispatch({transaction});
    }

}

export default alt.createActions(TransactionConfirmActions)
