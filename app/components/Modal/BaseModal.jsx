import React from "react";
import PropTypes from "prop-types";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";

import {getLogo} from "branding";
var logo = getLogo();

class BaseModal extends React.Component {
    constructor() {
        super();
    }

    componentDidMount() {
        this.modalEscapeListener = function(e) {
            if (e.keyCode === 27) {
                ZfApi.publish(this.props.id, "close");
            }
        }.bind(this);

        document.addEventListener("keydown", this.modalEscapeListener);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.modalEscapeListener);
    }

    render() {
        const {props} = this;
        const {
            id,
            overlay,
            onClose,
            overlayClose,
            className,
            modalHeader,
            noCloseBtn,
            noLogo,
            noHeader,
            children,
            leftHeader
        } = props;

        return (
            <Modal
                id={id}
                overlay={overlay}
                onClose={onClose}
                className={className}
                overlayClose={overlayClose}
            >
                <div className="modal-header">
                    {!noCloseBtn && (
                        <Trigger close={id}>
                            <a href="#" className="close-button">
                                &times;
                            </a>
                        </Trigger>
                    )}
                    {!noLogo &&
                        (leftHeader ? (
                            <img src={logo} />
                        ) : (
                            <div className="modal__logo">
                                <img src={logo} />
                            </div>
                        ))}
                    {!noHeader &&
                        modalHeader &&
                        (leftHeader ? (
                            <b
                                style={{
                                    paddingLeft: "0.8rem",
                                    fontSize: "1.3rem",
                                    position: "relative",
                                    top: "0.4rem"
                                }}
                            >
                                <Translate content={modalHeader} />
                            </b>
                        ) : (
                            <div className="text-center">
                                <div className="modal__title">
                                    <Translate
                                        component="h4"
                                        content={modalHeader}
                                    />
                                </div>
                            </div>
                        ))}
                </div>
                {!noHeader && leftHeader && <hr />}
                <div className="modal-content">{children}</div>
            </Modal>
        );
    }
}

BaseModal.defaultProps = {
    overlay: false
};

BaseModal.propTypes = {
    id: PropTypes.string.isRequired,
    onClose: PropTypes.func,
    className: PropTypes.string,
    overlay: PropTypes.bool,
    overlayClose: PropTypes.bool,
    noCloseBtn: PropTypes.bool
};

export default BaseModal;
