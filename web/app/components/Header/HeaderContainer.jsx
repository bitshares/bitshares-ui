import React from "react";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt/AltContainer";
import Header from "./Header";

class HeaderContainer extends React.Component {

    render() {
        return (
              <AltContainer 
                  stores={[AccountStore]}
                  inject={{
                    currentAccount: () => {
                        return AccountStore.getState().currentAccount;
                    },
                    linkedAccounts: () => {
                        return AccountStore.getState().linkedAccounts;
                    }
                  }} 
                  >
                <Header />
              </AltContainer>
        );
    }
}

export default HeaderContainer;
