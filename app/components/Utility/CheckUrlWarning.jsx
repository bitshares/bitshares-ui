import React from "react";
import Translate from "react-translate-component";

class CheckUrlWarning extends React.Component {
    render() {
        if (__ELECTRON__) {
            return null;
        }

        return (
            <div className={this.props.align === "left" ? null : "text-center"}>
                <p className="check-url-warning">
                    <Translate
                        className="label warning"
                        content="cryptobridge.general.important"
                        component="span"
                    />
                    <Translate
                        className="label-check-url"
                        content="cryptobridge.general.check_url"
                        component="span"
                    />
                </p>
                <img
                    className="secure-login-image"
                    src={`${__BASE_URL__}img/secure-login-address.png`}
                    alt=""
                />
            </div>
        );
    }
}

export default CheckUrlWarning;
