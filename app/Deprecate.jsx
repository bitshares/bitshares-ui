import React from "react";
import WalletDb from "stores/WalletDb";
import Settings from "./components/Settings/SettingsContainer";
import Translate from "react-translate-component";

export default class Deprecate extends React.Component {
    hasWallet() {
        return !!WalletDb.getWallet();
    }

    renderForWallet() {
        return (
            <div>
                <Translate content="migration.text_1" component="h4" />
                <Translate content="migration.text_2" component="p" unsafe />


                <Settings {...this.props} deprecated />


            </div>
        );
    }

    renderForCloud() {
        return (
            <div>
                <Translate content="migration.text_3" unsafe component="p" />
            </div>
        );
    }

    render() {
        return (
            <div className="grid-frame vertical">
                <div className="grid-block">
                    <div className="grid-content" style={{paddingTop: "2rem"}}>
                        <Translate content="migration.title" component="h2" />
                        <Translate content="migration.announcement_1" unsafe component="p" />
                        <p><a href="https://wallet.bitshares.org" target='blank' rel='noopener noreferrer'>https://wallet.bitshares.org</a></p>
                        {this.hasWallet() ? this.renderForWallet() : this.renderForCloud()}
                    </div>
                </div>
            </div>
        );
    }
};
