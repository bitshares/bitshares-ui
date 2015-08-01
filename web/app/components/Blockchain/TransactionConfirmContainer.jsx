import React from "react";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import AltContainer from "alt/AltContainer";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import TransactionConfirm from "./TransactionConfirm";

class TransactionConfirmContainer extends React.Component {

    constructor() {
        super();
        this.state = {onConfirmFunction: null};
    }

    componentDidMount() {
        TransactionConfirmStore.listen(this._onTransactionConfirm.bind(this));
    }

    componentWillUnmount() {
        TransactionConfirmStore.unlisten(this._onTransactionConfirm);
    }

    _getConfirmFunction(func) {
        console.log("got this func:", func);
        this.setState({onConfirmFunction: func});
    }

    _onTransactionConfirm() {
        var {tr, resolve, reject} = TransactionConfirmStore.getState();
        this.state.onConfirmFunction(tr, resolve, reject);
        // console.log('... _onTransactionConfirm',tr)
    }

    render() {

        return (
              <AltContainer 
                  stores={[AccountStore, AssetStore, TransactionConfirmStore]}
                  inject={{
                    tr: () => {
                        return TransactionConfirmStore.getState().tr;
                    },
                    resolve: () => {
                        return TransactionConfirmStore.getState().resolve;
                    },
                    reject: () => {
                        return TransactionConfirmStore.getState().reject;
                    },
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    account_id_to_name: () => {
                        return AccountStore.getState().account_id_to_name;
                    }
                  }} 
                  >
                <TransactionConfirm cb={this._getConfirmFunction.bind(this)} />
              </AltContainer>
        );
    }
}

export default TransactionConfirmContainer;
