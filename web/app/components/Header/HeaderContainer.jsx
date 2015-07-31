import React from "react";
import AccountStore from "stores/AccountStore";
import SessionStore from "stores/SessionStore";
import AltContainer from "alt/AltContainer";
import Header from "./Header";

class HeaderContainer extends React.Component {

    render() {
        return (
              <AltContainer 
                  stores={[AccountStore, SessionStore]}
                  inject={{
                    currentAccount: () => {
                        return AccountStore.getState().currentAccount;
                    },
                    linkedAccounts: () => {
                        return AccountStore.getState().linkedAccounts;
                    },
                    isLocked: () => {
                        return SessionStore.getState().isLocked;
                    }
                  }} 
                  >
                <Header />
              </AltContainer>
        );
    }
}

export default HeaderContainer;
