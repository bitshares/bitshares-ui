import React from "react";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt/AltContainer";
import Footer from "./Footer";

class FooterContainer extends React.Component {

    render() {
        return (
              <AltContainer 
                  stores={[BlockchainStore]}
                  inject={{
                    dynGlobalObject: () => {
                        return BlockchainStore.getState().dynGlobalObject;
                    }
                  }} 
                  >
                <Footer />
              </AltContainer>
        );
    }
}

export default FooterContainer;
