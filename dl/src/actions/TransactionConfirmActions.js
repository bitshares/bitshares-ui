import alt from "alt-instance"

class TransactionConfirmActions {

    confirm_and_broadcast(tr) {
        return new Promise( (resolve, reject) => {
            this.dispatch({tr, resolve, reject})
        })
    }
}

export default alt.createActions(TransactionConfirmActions)
