import alt from "alt-instance"

class TransactionConfirmActions {

    confirm(transaction) {
        this.dispatch({transaction})
    }

    broadcast(transaction) {
        this.dispatch();

        let broadcast_timeout = setTimeout(() => {
            this.actions.error("Your transaction wasn't confirmed in a timely manner, please try again later.");
        }, 12000);

        setTimeout(()=>{//timeout necessary to see the UI loading indicator
            transaction.broadcast(() => this.actions.wasBroadcast()).then( (res)=> {
                clearTimeout(broadcast_timeout);
                this.actions.wasIncluded(res);
            }).catch( error => {
                clearTimeout(broadcast_timeout);
                let message = error.message.split( '\n' )[1];
                this.actions.error(message);
            });
        }, 100)
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
