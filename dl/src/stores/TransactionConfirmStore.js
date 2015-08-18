import alt from "alt-instance"
import TransactionConfirmActions from "actions/TransactionConfirmActions"

class TransactionConfirmStore {
    
    constructor() {
        this.bindActions(TransactionConfirmActions);
        this.state = {
            transaction: null,
            error: null,
            broadcasted: false,
            trx_id: null,
            trx_block_num: null
        };
    }

    onConfirm({transaction}) {
        this.setState({transaction, broadcasted: false, error: null, trx_id: null});
    }

    onClose() {
        this.setState({transaction: null, broadcasted: false, error: null});
    }

    onBroadcast(res) {
        this.setState({broadcasted: true, trx_id: res[0].id, trx_block_num: res[0].block_num, error: null});
    }

    onError(error) {
        this.setState({broadcasted: false, error});
    }

}

export default alt.createStore(TransactionConfirmStore, 'TransactionConfirmStore');
