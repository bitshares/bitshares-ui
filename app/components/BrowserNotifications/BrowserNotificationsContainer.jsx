import React from "react";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt-container";
import BrowserNotifications from "./BrowserNotifications";

const Wrapper = props => {
    return !!props.account ? <BrowserNotifications {...props} /> : null;
};

class BrowserNotificationsContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AccountStore]}
                inject={{
                    account: () => {
                        return AccountStore.getState().currentAccount;
                    },
                    settings: () => {
                        return SettingsStore.getState().settings;
                    }
                }}
            >
                <Wrapper />
            </AltContainer>
        );
    }
}

export default BrowserNotificationsContainer;
