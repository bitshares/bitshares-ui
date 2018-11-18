import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import WalletBlockSelection from "./WalletBlockSelection";
import WalletHeaderSelection from "./WalletHeaderSelection";
import AccountBlockSelection from "./AccountBlockSelection";
import AccountHeaderSelection from "./AccountHeaderSelection";

export default class RegistrationSelector extends React.Component {
    static propTypes = {
        children: PropTypes.element
    };

    static contextTypes = {
        router: PropTypes.object.isRequired
    };

    static defaultProps = {
        children: null
    };

    constructor() {
        super();
        this.state = {
            activeWalletModel: true
        };
    }

    onSelect(route) {
        this.props.history.push(`/registration/${route}`);
    }

    changeActiveModel(isActiveWallet) {
        this.setState({activeWalletModel: isActiveWallet});
    }

    renderHeader(isWalletSection) {
        const {activeWalletModel} = this.state;
        return (
            <div className="small-horizontal small-only-block">
                <WalletHeaderSelection
                    active={activeWalletModel}
                    onChangeActive={() => this.changeActiveModel(true)}
                    forSmall={!isWalletSection}
                />
                <AccountHeaderSelection
                    active={!activeWalletModel}
                    onChangeActive={() => this.changeActiveModel(false)}
                    forSmall={isWalletSection}
                />
            </div>
        );
    }

    render() {
        if (this.props.children) {
            return this.props.children;
        }

        const {activeWalletModel} = this.state;
        return (
            <div className="grid-block align-center registration-layout">
                <div className="grid-block shrink vertical text-center registration-selector">
                    <Translate
                        content="registration.title"
                        component="p"
                        className="registration-title"
                    />
                    <div className="registration-container">
                        <div className="v-align">
                            <div
                                className={`${
                                    !activeWalletModel
                                        ? "inactive-model-block"
                                        : ""
                                } selection-block align-center plate`}
                            >
                                {this.renderHeader(true)}
                                <WalletBlockSelection
                                    onSelect={() => this.onSelect("local")}
                                    active={activeWalletModel}
                                    onChangeActive={() =>
                                        this.changeActiveModel(true)
                                    }
                                />
                            </div>
                            <div
                                className={`${
                                    activeWalletModel
                                        ? "inactive-model-block"
                                        : ""
                                } selection-block align-center plate`}
                            >
                                {this.renderHeader(false)}
                                <AccountBlockSelection
                                    onSelect={() => this.onSelect("cloud")}
                                    active={!activeWalletModel}
                                    onChangeActive={() =>
                                        this.changeActiveModel(false)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
