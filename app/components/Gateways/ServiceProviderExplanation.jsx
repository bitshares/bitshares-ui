import React from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import {
    Table,
    Button,
    Radio,
    Modal,
    Checkbox,
    Collapse
} from "bitshares-ui-style-guide";
import ChainTypes from "../Utility/ChainTypes";

class ServiceProviderExplanation extends React.Component {
    static propTypes = {
        showSalutation: PropTypes.bool
    };

    static defaultProps = {
        showSalutation: false
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                {this.props.showSalutation && (
                    <Translate
                        content="external_service_provider.welcome.hello"
                        component="h2"
                    />
                )}
                {this.props.showSalutation && (
                    <Translate
                        content="external_service_provider.welcome.first_line"
                        component="p"
                    />
                )}
                <p>
                    <Translate content="external_service_provider.welcome.explanation_dex" />
                    <Translate content="external_service_provider.welcome.explanation_service_providers" />
                </p>
                <p>
                    <Translate content="external_service_provider.welcome.explanation_what_to_do" />
                    <Translate content="external_service_provider.welcome.explanation_later" />
                </p>
            </React.Fragment>
        );
    }
}

export default ServiceProviderExplanation;
