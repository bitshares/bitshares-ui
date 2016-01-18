import React from "react";                                                                                                                                                            
import BlockchainActions from "actions/BlockchainActions";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt-container";
import Fees from "./Fees";

class FeesContainer extends React.Component {

    render() {
        return (
            <AltContainer 
                stores={[SettingsStore]}
                inject={{
                        settings : SettingsStore.getState().settings
                }}>   
             <Fees {...this.props}/>
            </AltContainer>
           );  
    }   
}

export default FeesContainer;
