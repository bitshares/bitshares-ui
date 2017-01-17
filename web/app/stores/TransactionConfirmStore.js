import alt from "alt-instance";
import TransactionConfirmActions from "actions/TransactionConfirmActions";

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
            propose: false,
            fee_paying_account: null // proposal fee_paying_account
        };
    }

    onConfirm({transaction}) {
        let init_state = this.getInitialState();
        let state = {...init_state, transaction: transaction, closed: false, broadcasted_transaction: null}
        //console.log("-- TransactionConfirmStore.onConfirm -->", state);
        this.setState(state);
    }

    onClose() {
        //console.log("-- TransactionConfirmStore.onClose -->", state);
        this.setState({closed: true});
    }

    onBroadcast(payload) {
        //console.log("-- TransactionConfirmStore.onBroadcast -->", state);
        this.setState(payload);
        if (payload.broadcasted_transaction) {
            this.setState({
                broadcasted_transaction: this.state.transaction
            });
        }
    }

    onWasBroadcast(res) {
        //console.log("-- TransactionConfirmStore.onWasBroadcast -->", state);
        this.setState({broadcasting: false, broadcast: true});
    }

    onWasIncluded(res) {
        //console.log("-- TransactionConfirmStore.onWasIncluded -->", this.state);
        this.setState({
            error: null,
            broadcasting: false,
            broadcast: true,
            included: true,
            trx_id: res[0].id,
            trx_block_num: res[0].block_num,
            broadcasted_transaction: this.state.transaction
        });
    }

    onError({ error }) {
        this.setState({broadcast: false, broadcasting: false, error});
    }

    onTogglePropose() {
        this.setState({ propose: ! this.state.propose });
    }

    onProposeFeePayingAccount(fee_paying_account) {
        this.setState({ fee_paying_account });
    }

    reset() {
        //console.log("-- TransactionConfirmStore.reset -->");
        this.state = this.getInitialState();
    }

}

export default alt.createStore(TransactionConfirmStore, 'TransactionConfirmStore');
