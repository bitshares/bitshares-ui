import alt from "alt-instance"

class TransactionConfirmActions {

    confirm(transaction) {
        this.dispatch({transaction})
    }

    broadcast(transaction) {
        this.dispatch();
        setTimeout(()=>{//timeout necessary to see the UI loading indicator
            transaction.broadcast(() => this.actions.wasBroadcast()).then( (res)=> {
                this.actions.wasIncluded(res);
            }).catch( error => {
                console.log("TransactionConfirmActions.broadcast error", error);
                let message = error.message.split( '\n' )[1];
                this.actions.error(message);
            });
        }, 250)
    }

    wasBroadcast(res){
        console.log("-- TransactionConfirmActions.wasBroadcast -->");
        this.dispatch(res);
    }

    wasIncluded(res){
        console.log("-- TransactionConfirmActions.wasIncluded -->");
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
