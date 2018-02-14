import React from "react";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt-container";
import BrowserNotifications from "./BrowserNotifications";

class BrowserNotificationsContainer extends React.Component {

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
                <BrowserNotifications/>
            </AltContainer>
        );
    }
}

export default BrowserNotificationsContainer;
