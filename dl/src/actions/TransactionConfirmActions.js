import alt from "alt-instance"

class TransactionConfirmActions {

    confirm(transaction) {
        this.dispatch({transaction})
    }

    broadcast(transaction) {
        transaction.broadcast().then( (res)=> {
            this.dispatch(res);
        }).catch( error => {
            console.log("TransactionConfirmActions.broadcast error", error);
            let message = error.message.split( '\n' )[1];
            this.actions.error(message);
        });
    }

    close() {
        this.dispatch();
    }

    error(msg) {
        this.dispatch({error: msg});
    }
}

export default alt.createActions(TransactionConfirmActions)
