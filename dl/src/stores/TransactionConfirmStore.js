import alt from "alt-instance"
import TransactionConfirmActions from "actions/TransactionConfirmActions"

class TransactionConfirmStore {
    
    constructor() {
        this.bindListeners({
            onConfirm: TransactionConfirmActions.confirm_and_broadcast
        })
        this.state = {}
    }
    
    onConfirm({tr, resolve, reject}) {
        //DEBUG console.log('... onConfirm',{tr, resolve, reject})
        this.setState({tr, resolve, reject})
    }
}

export default alt.createStore(TransactionConfirmStore, 'TransactionConfirmStore')
