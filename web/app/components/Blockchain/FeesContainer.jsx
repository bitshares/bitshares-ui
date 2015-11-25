import React from "react";                                                                                                                                                            
import BlockchainActions from "actions/BlockchainActions";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt/AltContainer";
import Fees from "./Fees";

class FeesContainer extends React.Component {

    render() {
        return (
            <AltContainer 
                stores={[SettingsStore]}
                inject={{
                        settings : SettingsStore.getState().settings
                }}>   
             <Fees/>
            </AltContainer>
           );  
    }   
}

export default FeesContainer;
