import alt from "alt-instance"
import TransactionConfirmActions from "actions/TransactionConfirmActions"

class TransactionConfirmStore {
    
    constructor() {
        this.bindActions(TransactionConfirmActions);
        this.state = this.getInitialState();
        this.exportPublicMethods({reset: this.reset.bind(this)});
    }

    getInitialState() {
        return {
            transaction: null,
            error: null,
            broadcasting: false,
            broadcast: false,
            included: false,
            trx_id: null,
            trx_block_num: null,
            closed: true,
            broadcasted_transaction: null
        };
    }

    onConfirm({transaction}) {
        let init_state = this.getInitialState();
        this.setState({...init_state, transaction, closed: false, broadcasted_transaction: null});
    }

    onClose() {
        this.setState({closed: true});
    }

    onBroadcast() {
        this.setState({broadcasting: true});
    }

    onWasBroadcast(res) {
        this.setState({broadcasting: false, broadcast: true});
    }

    onWasIncluded(res) {
        this.setState({
            error: null,
            broadcasting: false,
            broadcast: true,
            included: true,
            trx_id: res[0].id,
            trx_block_num: res[0].block_num,
            broadcasted_transaction: this.state.transaction});
    }

    onError(error) {
        this.setState({broadcast: false, broadcasting: false, error});
    }

    reset() {
        this.state = this.getInitialState();
    }

}

export default alt.createStore(TransactionConfirmStore, 'TransactionConfirmStore');
