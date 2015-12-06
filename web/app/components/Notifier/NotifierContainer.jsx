import React from "react";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt-container";
import Notifier from "./Notifier";

class NotifierContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[AccountStore]}
                  inject={{
                    account: () => {
                        return AccountStore.getState().currentAccount;
                    }
                  }} 
                  >
                <Notifier/>
              </AltContainer>
        );
    }
}

export default NotifierContainer;
