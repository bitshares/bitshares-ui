import alt from "alt-instance"
import TransactionConfirmActions from "actions/TransactionConfirmActions"

class TransactionConfirmStore {
    
    constructor() {
        this.bindActions(TransactionConfirmActions);
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            transaction: null,
            error: null,
            broadcasted: false,
            broadcasting: false,
            trx_id: null,
            trx_block_num: null,
            closed: true
        };
    }

    onConfirm({transaction}) {
        let init_state = this.getInitialState();
        this.setState({...init_state, transaction, closed: false});
    }

    onClose() {
        this.setState({closed: true});
    }

    onBroadcast() {
        this.setState({broadcasting: true});
    }

    onBroadcasted(res) {
        this.setState({broadcasted: true, broadcasting: false, trx_id: res[0].id, trx_block_num: res[0].block_num});
    }

    onError(error) {
        this.setState({broadcasted: false, broadcasting: false, error});
    }

}

export default alt.createStore(TransactionConfirmStore, 'TransactionConfirmStore');
