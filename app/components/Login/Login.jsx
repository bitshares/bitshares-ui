import React from "react";
import Translate from "react-translate-component";
import AccountLogin from "./AccountLogin";
import WalletLogin from "./WalletLogin";
import WalletHeaderSelection from "../Registration/WalletHeaderSelection";
import AccountHeaderSelection from "../Registration/AccountHeaderSelection";

export default class Login extends React.Component {
    constructor() {
        super();
        this.state = {
            activeWalletModel: true
        };
    }

    changeActiveModel(isActiveWallet) {
        this.setState({activeWalletModel: isActiveWallet});
    }

    render() {
        const {activeWalletModel} = this.state;
        return (
            <div className="grid-block align-center registration-layout">
                <div className="grid-block shrink vertical text-center registration-selector">
                    <Translate
                        content="login.title"
                        component="p"
                        className="registration-title"
                    />
                    <div>
                        <div className="v-align login-page-selector">
                            <div
                                className={`${
                                    !activeWalletModel
                                        ? "inactive-model-block"
                                        : ""
                                } selection-block align-center plate`}
                            >
                                <div className="small-horizontal small-only-block">
                                    <WalletHeaderSelection
                                        active={activeWalletModel}
                                        onChangeActive={() =>
                                            this.changeActiveModel(true)
                                        }
                                        loginPage
                                    />
                                    <AccountHeaderSelection
                                        active={!activeWalletModel}
                                        onChangeActive={() =>
                                            this.changeActiveModel(false)
                                        }
                                        forSmall
                                        loginPage
                                    />
                                </div>
                                <WalletLogin
                                    active={activeWalletModel}
                                    onChangeActive={() =>
                                        !activeWalletModel
                                            ? this.changeActiveModel(true)
                                            : null
                                    }
                                    goToAccountModel={() =>
                                        this.changeActiveModel(false)
                                    }
                                    history={this.props.history}
                                />
                            </div>
                            <div
                                className={`${
                                    activeWalletModel
                                        ? "inactive-model-block"
                                        : ""
                                } selection-block align-center plate`}
                            >
                                <div className="small-horizontal small-only-block">
                                    <WalletHeaderSelection
                                        active={activeWalletModel}
                                        onChangeActive={() =>
                                            this.changeActiveModel(true)
                                        }
                                        forSmall
                                        loginPage
                                    />
                                    <AccountHeaderSelection
                                        active={!activeWalletModel}
                                        onChangeActive={() =>
                                            this.changeActiveModel(false)
                                        }
                                        loginPage
                                    />
                                </div>
                                <AccountLogin
                                    active={!activeWalletModel}
                                    history={this.props.history}
                                    onChangeActive={() =>
                                        activeWalletModel
                                            ? this.changeActiveModel(false)
                                            : null
                                    }
                                    goToWalletModel={() =>
                                        this.changeActiveModel(true)
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
