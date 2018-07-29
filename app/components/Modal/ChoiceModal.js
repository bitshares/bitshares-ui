import React from "react";
import PropTypes from "prop-types";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "./BaseModal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import counterpart from "counterpart";

class ChoiceModal extends React.Component {
    static propTypes = {
        modalId: PropTypes.string.isRequired,
        choices: PropTypes.array.isRequired,
        content: PropTypes.object
    };

    static defaultProps = {
        content: null
    };

    constructor() {
        super();
        this.state = {
            show: false
        };
    }

    show() {
        this.setState({show: true});
        ZfApi.publish(this.props.modalId, "open");
    }

    confirmClicked(callback, e) {
        e.preventDefault();
        ZfApi.publish(this.props.modalId, "close");
        setTimeout(() => {
            this.setState({show: false});
        }, 500);
        callback();
    }

    render() {
        return (
            <BaseModal id={this.props.modalId} overlay={true}>
                {this.state.show && (
                    <div className="grid-block vertical">
                        {this.props.content}
                        {React.Children.map(this.props.children, (child, i) => {
                            let props = {};
                            props["key"] = i + "";
                            return React.cloneElement(child, props);
                        })}
                        <br />
                        <br />
                        <br />
                        <div className="grid-content button-group no-overflow">
                            {this.props.choices.map(child => {
                                return (
                                    <a
                                        className="button primary"
                                        onClick={this.confirmClicked.bind(
                                            this,
                                            child.callback
                                        )}
                                    >
                                        <Translate
                                            content={child.translationKey}
                                        />
                                    </a>
                                );
                            })}
                            <Trigger close={this.props.modalId}>
                                <div className="button primary hollow">
                                    <Translate content="account.perm.cancel" />
                                </div>
                            </Trigger>
                        </div>
                    </div>
                )}
            </BaseModal>
        );
    }
}

export default ChoiceModal;
