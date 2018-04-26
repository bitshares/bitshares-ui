import React from "react";
import {connect} from "alt-react";

import Translate from "react-translate-component";

import ActionSheet from "react-foundation-apps/src/action-sheet";

import SettingsStore from "stores/SettingsStore";
import IntlActions from "actions/IntlActions";

const FlagImage = ({flag, width = 20, height = 20}) => {
    return (
        <img
            height={height}
            width={width}
            src={`${__BASE_URL__}language-dropdown/${flag.toUpperCase()}.png`}
        />
    );
};

class LanguageSelector extends React.Component {
    shouldComponentUpdate(nextProps) {
        return nextProps !== this.props;
    }

    render() {
        const {currentLocale, locales} = this.props;

        if (!currentLocale || !locales) {
            return <span />;
        }

        const flagDropdown = (
            <ActionSheet>
                <ActionSheet.Button title="" style={{width: "64px"}}>
                    <a
                        className="clear button"
                        style={{backgroundColor: "transparent"}}
                    >
                        <FlagImage flag={currentLocale} />
                    </a>
                </ActionSheet.Button>
                <ActionSheet.Content>
                    <ul className="no-first-element-top-border">
                        {locales.map(locale => {
                            return (
                                <li key={locale}>
                                    <a
                                        href
                                        onClick={e => {
                                            e.preventDefault();
                                            IntlActions.switchLocale(locale);
                                        }}
                                    >
                                        <div className="table-cell">
                                            <FlagImage
                                                width="20"
                                                height="20"
                                                flag={locale}
                                            />
                                        </div>
                                        <div
                                            className="table-cell"
                                            style={{paddingLeft: 10}}
                                        >
                                            <Translate
                                                content={"languages." + locale}
                                            />
                                        </div>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </ActionSheet.Content>
            </ActionSheet>
        );

        return <div className="shrink text-center">{flagDropdown}</div>;
    }
}

export default connect(LanguageSelector, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            locales: SettingsStore.getState().defaults.locale,
            currentLocale: SettingsStore.getState().settings.get("locale")
        };
    }
});
