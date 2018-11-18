import React from "react";
// import PropTypes from "prop-types";
// import ZfApi from "react-foundation-apps/src/utils/foundation-api";
// import Modal from "react-foundation-apps/src/modal";
// import Trigger from "react-foundation-apps/src/trigger";
// import Translate from "react-translate-component";

// import {getLogo} from "branding";
// var logo = getLogo();

class BaseModal extends React.Component {
    render() {
        return (
            <div>
                Base Modal was removed by task following below:
                <br />
                https://github.com/bitshares/bitshares-ui/issues/1942
            </div>
        );
    }
}

// BaseModal.defaultProps = {
//     overlay: false
// };
//
// BaseModal.propTypes = {
//     id: PropTypes.string.isRequired,
//     onClose: PropTypes.func,
//     className: PropTypes.string,
//     overlay: PropTypes.bool,
//     overlayClose: PropTypes.bool,
//     noCloseBtn: PropTypes.bool
// };

export default BaseModal;
