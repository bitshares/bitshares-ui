import React from "react";
import DelegateStore from "stores/DelegateStore";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt/AltContainer";
import Delegates from "./Delegates";
import { RouteHandler } from "react-router";

class DelegatesContainer extends React.Component {

    render() {
        return (
              <AltContainer 
                  stores={[BlockchainStore, DelegateStore]}
                  inject={{
                    delegates: () => {
                        return DelegateStore.getState().delegates;
                    },
                    delegate_id_to_name: () => {
                        return DelegateStore.getState().delegate_id_to_name;
                    },
                    delegate_name_to_id: () => {
                        return DelegateStore.getState().delegate_name_to_id;
                    },
                    delegateAccounts: () => {
                        return DelegateStore.getState().delegateAccounts;
                    },
                    globalObject: () => {
                        return BlockchainStore.getState().globalObject;
                    }
                  }} 
                  >
                <RouteHandler />
              </AltContainer>
        );
    }
}

export default DelegatesContainer;
