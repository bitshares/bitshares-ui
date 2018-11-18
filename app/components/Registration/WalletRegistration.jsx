import React from "react";
import ReactTooltip from "react-tooltip";
import SettingsActions from "actions/SettingsActions";
import utils from "common/utils";
import WalletRegistrationConfirm from "./WalletRegistrationConfirm";
import WalletRegistrationForm from "./WalletRegistrationForm";

class WalletRegistration extends React.Component {
    constructor() {
        super();
        this.state = {
            confirmationStep: false,
            checkboxRemember: false,
            checkboxUploaded: false,
            checkboxRecover: false
        };

        this.toggleConfirmed = this.toggleConfirmed.bind(this);
    }

    componentWillMount() {
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
    }

    componentDidMount() {
        ReactTooltip.rebuild();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !utils.are_equal_shallow(nextState, this.state);
    }

    continue() {
        this.setState({
            confirmationStep: true
        });
    }

    toggleConfirmed(checkbox) {
        this.setState({[checkbox]: !this.state[checkbox]});
    }

    render() {
        const {
            confirmationStep,
            checkboxRemember,
            checkboxUploaded,
            checkboxRecover
        } = this.state;

        return (
            <div className="no-margin grid-block registration-layout registration">
                <div className="grid-block horizontal align-center text-center">
                    <div>
                        <img
                            className={`${
                                checkboxRemember &&
                                checkboxUploaded &&
                                checkboxRecover
                                    ? "confirmed"
                                    : ""
                            } model-img`}
                            src="/model-type-images/flesh-drive.svg"
                            alt="wallet"
                        />
                    </div>
                    <div className="create-account-block">
                        {!confirmationStep ? (
                            <WalletRegistrationForm
                                history={this.props.history}
                                continue={() => this.continue()}
                            />
                        ) : (
                            <WalletRegistrationConfirm
                                history={this.props.history}
                                toggleConfirmed={this.toggleConfirmed}
                                checkboxRemember={checkboxRemember}
                                checkboxUploaded={checkboxUploaded}
                                checkboxRecover={checkboxRecover}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default WalletRegistration;
