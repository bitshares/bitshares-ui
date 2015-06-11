import React from "react";
import DelegateStore from "stores/DelegateStore";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt/AltContainer";
import Delegates from "./Delegates";

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
                    dynGlobalObject: () => {
                        return BlockchainStore.getState().dynGlobalObject;
                    },
                    globalObject: () => {
                        return BlockchainStore.getState().globalObject;
                    }
                  }} 
                  >
                <Delegates/>
              </AltContainer>
        );
    }
}

export default DelegatesContainer;
