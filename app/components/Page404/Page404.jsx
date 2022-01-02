import React from "react";
import {Link} from "react-router-dom";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import Translate from "react-translate-component";

import light from "assets/logo-404-light.png";
import dark from "assets/logo-404-dark.png";
import midnight from "assets/logo-404-midnight.png";

class Page404 extends React.Component {
    static defaultProps = {
        subtitle: "page_not_found_subtitle"
    };
    render() {
        let logo;

        if (this.props.theme === "lightTheme") {
            logo = light;
        }

        if (this.props.theme === "darkTheme") {
            logo = dark;
        }

        if (this.props.theme === "midnightTheme") {
            logo = midnight;
        }

        return (
            <div className="page-404">
                <div className="page-404-container">
                    <div className="page-404-logo">
                        <img src={logo} alt="Logo" />
                    </div>
                    <div className="page-404-title">
                        <Translate content="page404.page_not_found_title" />
                    </div>
                    <div className="page-404-subtitle">
                        <Translate content={"page404." + this.props.subtitle} />
                    </div>
                    <div className="page-404-button-back">
                        <Link to={"/"}>
                            <Translate
                                component="button"
                                className="button"
                                content="page404.home"
                            />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default Page404 = connect(Page404, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            theme: SettingsStore.getState().settings.get("themes")
        };
    }
});
