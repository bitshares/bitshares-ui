import React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import jwt from "jsonwebtoken";
import {connect} from "alt-react";
import SettingsStore from "../../stores/SettingsStore";
import PropTypes from "prop-types";

class GoogleReCAPTCHA extends React.Component {
    static propTypes = {
        sitekey: PropTypes.string.isRequired,
        theme: PropTypes.string.isRequired,
        payload: PropTypes.object.isRequired,
        onChange: PropTypes.func.isRequired
    };

    static defaultProps = {
        sitekey: __RECAPTCHA_SITE_KEY__,
        theme: "dark",
        payload: {}
    };

    componentWillReceiveProps(nextProps) {
        if (
            __ELECTRON__ &&
            JSON.stringify(nextProps.payload) !==
                JSON.stringify(this.props.payload)
        ) {
            this.props.onChange(
                jwt.sign(
                    Object.assign(nextProps.payload, {ts: Date.now()}),
                    this.props.sitekey,
                    {expiresIn: 300}
                )
            );
        }
    }

    render() {
        if (__ELECTRON__) {
            return <div />;
        }

        return (
            <div style={{marginBottom: 20}}>
                <ReCAPTCHA
                    sitekey={this.props.sitekey}
                    onChange={this.props.onChange}
                    theme={this.props.theme}
                />
            </div>
        );
    }
}

export default connect(GoogleReCAPTCHA, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            theme:
                SettingsStore.getState().settings.get("themes") === "lightTheme"
                    ? "light"
                    : "dark"
        };
    }
});
