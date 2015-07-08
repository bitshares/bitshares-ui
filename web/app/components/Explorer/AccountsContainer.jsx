import React from "react";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt/AltContainer";
import Accounts from "./Accounts";

class AccountsContainer extends React.Component {

    render() {
        return (
              <AltContainer 
                  stores={[AccountStore]}
                  inject={{
                    account_id_to_name: () => {
                        return AccountStore.getState().account_id_to_name;
                    }
                  }} 
                  >
                <Accounts />
              </AltContainer>
        );
    }
}

export default AccountsContainer;
