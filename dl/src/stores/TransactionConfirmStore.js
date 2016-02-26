import alt from "alt-instance"
import TransactionConfirmActions from "actions/TransactionConfirmActions"

class TransactionConfirmStore {
    
    constructor() {
        this.bindActions(TransactionConfirmActions);
        this.state = this.getInitialState();
        this.exportPublicMethods({reset: this.reset.bind(this)});
    }

    getInitialState() {
        //console.log("-- TransactionConfirmStore.getInitialState -->");
        return {
            transaction: null,
            error: null,
            broadcasting: false,
            broadcast: false,
            included: false,
            trx_id: null,
            trx_block_num: null,
            closed: true,
            broadcasted_transaction: null,
            broadcast_confirmed_callback: null
        };
    }

    onConfirm({transaction, broadcast_confirmed_callback}) {
        let init_state = this.getInitialState();
        let state = {...init_state, transaction: transaction, closed: false, broadcasted_transaction: null, broadcast_confirmed_callback}
        //console.log("-- TransactionConfirmStore.onConfirm -->", state);
        this.setState(state);
    }

    onClose() {
        let state = this.state;
        //console.log("-- TransactionConfirmStore.onClose -->", state);
        this.setState({closed: true});
    }

    onBroadcast() {
        let state = this.state;
        //console.log("-- TransactionConfirmStore.onBroadcast -->", state);
        this.setState({broadcasting: true});
    }

    onWasBroadcast(res) {
        let state = this.state;
        //console.log("-- TransactionConfirmStore.onWasBroadcast -->", state);
        this.setState({broadcasting: false, broadcast: true});
    }

    onWasIncluded(res) {
        //console.log("-- TransactionConfirmStore.onWasIncluded -->", this.state);
        let state = this.state;
        let new_state = {
            error: null,
            broadcasting: false,
            broadcast: true,
            included: true,
            broadcasted_transaction: state.transaction
        };
        if (state.transaction.type && state.transaction.type === "blind") {
            new_state.trx_id = res;
        } else {
            new_state.trx_id = res[0].id;
            new_state.trx_block_num = res[0].block_num;
        }
        this.setState(new_state);
    }

    onError({ error }) {
        let state = this.state;
        this.setState({broadcast: false, broadcasting: false, error});
    }

    reset() {
        //console.log("-- TransactionConfirmStore.reset -->");
        this.state = this.getInitialState();
    }

    onConfirmBlind({transaction, broadcast_confirmed_callback}) {
        let init_state = this.getInitialState();
        let state = {...init_state, transaction: transaction, closed: false, broadcasted_transaction: null, broadcast_confirmed_callback}
        console.log("-- TransactionConfirmStore.onConfirm -->", state);
        this.setState(state);
    }

}

export default alt.createStore(TransactionConfirmStore, 'TransactionConfirmStore');
