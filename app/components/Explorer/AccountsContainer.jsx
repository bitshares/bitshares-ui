import React from "react";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt-container";
import Accounts from "./Accounts";
import Explorer from "./Explorer";

class AccountsContainer extends React.Component {
    
    render() {
        let content = 
              <AltContainer 
                  stores={[AccountStore]}
                  inject={{
                    searchAccounts: () => {
                        return AccountStore.getState().searchAccounts;
                    },
                    searchTerm: () => {
                        return AccountStore.getState().searchTerm;
                    }
                  }} 
                  >
                <Accounts />
              </AltContainer>;
                      
             return (<Explorer tab="accounts" content={content}/>);         
    }
}

export default AccountsContainer;
