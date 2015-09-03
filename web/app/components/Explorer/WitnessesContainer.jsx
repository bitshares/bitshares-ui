import React from "react";
import WitnessStore from "stores/WitnessStore";
import AltContainer from "alt/AltContainer";
import { RouteHandler } from "react-router";

class WitnessesContainer extends React.Component {

    render() {
        return (
              <AltContainer 
                  stores={[WitnessStore]}
                  inject={{
                    witnesses: () => {
                        return WitnessStore.getState().witnesses;
                    },
                    witness_name_to_id: () => {
                        return WitnessStore.getState().witness_name_to_id;
                    },
                    witness_id_to_name: () => {
                        return WitnessStore.getState().witness_id_to_name;
                    },
                    witnessAccounts: () => {
                        return WitnessStore.getState().witnessAccounts;
                    }
                  }} 
                  >
                <RouteHandler />
              </AltContainer>
        );
    }
}

export default WitnessesContainer;
