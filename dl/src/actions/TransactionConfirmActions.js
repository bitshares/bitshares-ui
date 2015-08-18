import alt from "alt-instance"

class TransactionConfirmActions {

    confirm(transaction) {
        this.dispatch({transaction})
    }

    broadcast(transaction) {
        transaction.broadcast().then( (res)=> {
            this.actions.broadcasted(res);
        }).catch( error => {
            console.log("TransactionConfirmActions.broadcast error", error);
            let message = error.message.split( '\n' )[1];
            this.actions.error(message);
        });
        this.dispatch();
    }

    broadcasted(res){
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
