import React from "react";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt-container";
import Fees from "./Fees";
import MetaTag from "../Layout/MetaTag";

class FeesContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[SettingsStore]}
                inject={{
                    settings: SettingsStore.getState().settings
                }}
            >
                <MetaTag path="explorer/fees" />
                <Fees {...this.props} />
            </AltContainer>
        );
    }
}

export default FeesContainer;
