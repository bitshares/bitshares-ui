import React from "react";
import PropTypes from "prop-types";
import cnames from "classnames";
import {connect} from "alt-react";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import counterpart from "counterpart";
import {withRouter} from "react-router-dom";

/**
 *  Renders a tab layout, handling switching and optionally persists the currently open tab using the SettingsStore
 *
 *  props:
 *     setting: unique name to be used to remember the active tab of this tabs layout,
 *     tabsClass: optional classes for the tabs container div
 *     contentClass: optional classes for the content container div
 *
 *  Usage:
 *
 *  <Tabs setting="mySetting">
 *      <Tab title="locale.string.title1">Tab 1 content</Tab>
 *      <Tab title="locale.string.title2">Tab 2 content</Tab>
 *  </Tabs>
 *
 */

class Tab extends React.Component {
    static propTypes = {
        changeTab: PropTypes.func,
        isActive: PropTypes.bool.isRequired,
        index: PropTypes.number.isRequired,
        className: PropTypes.string,
        isLinkTo: PropTypes.string,
        subText: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
    };

    static defaultProps = {
        isActive: false,
        index: 0,
        className: "",
        isLinkTo: "",
        subText: null
    };

    render() {
        let {
            isActive,
            index,
            changeTab,
            title,
            className,
            updatedTab,
            disabled,
            subText
        } = this.props;
        let c = cnames({"is-active": isActive}, className);

        if (typeof title === "string" && title.indexOf(".") > 0) {
            title = counterpart.translate(title);
        }

        // dont string concetenate subText directly within the rendering, subText can be an object without toString
        // implementation, but valid DOM (meaning, don't do subText + "someString"

        if (this.props.collapsed) {
            // if subText is empty, dont render it, we dont want empty brackets added
            if (typeof subText === "string") {
                subText = subText.trim();
            }
            return (
                <option value={index} data-is-link-to={this.props.isLinkTo}>
                    <span className="tab-title">
                        {title}
                        {updatedTab ? "*" : ""}
                        {subText && " ("}
                        {subText && subText}
                        {subText && ")"}
                    </span>
                </option>
            );
        }
        return (
            <li
                className={c}
                onClick={
                    !disabled
                        ? changeTab.bind(this, index, this.props.isLinkTo)
                        : null
                }
            >
                <a>
                    <span className="tab-title">
                        {title}
                        {updatedTab ? "*" : ""}
                    </span>
                    {subText && <div className="tab-subtext">{subText}</div>}
                </a>
            </li>
        );
    }
}

class Tabs extends React.Component {
    static propTypes = {
        setting: PropTypes.string,
        defaultActiveTab: PropTypes.number,
        segmented: PropTypes.bool
    };

    static defaultProps = {
        active: 0,
        defaultActiveTab: 0,
        segmented: true,
        contentClass: "",
        style: {}
    };

    constructor(props) {
        super();
        this.state = {
            activeTab: props.setting
                ? props.viewSettings.get(props.setting, props.defaultActiveTab)
                : props.defaultActiveTab,
            width: window.innerWidth
        };

        this._setDimensions = this._setDimensions.bind(this);
    }

    componentDidMount() {
        this._setDimensions();
        window.addEventListener("resize", this._setDimensions, {
            capture: false,
            passive: true
        });
    }

    componentWillReceiveProps(nextProps) {
        let nextSetting = nextProps.viewSettings.get(nextProps.setting);
        if (nextSetting !== this.props.viewSettings.get(this.props.setting)) {
            this.setState({
                activeTab: nextSetting
            });
        }
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setDimensions);
    }

    _setDimensions() {
        let width = window.innerWidth;

        if (width !== this.state.width) {
            this.setState({width});
        }
    }

    _changeTab(value, isLinkTo) {
        if (value === this.state.activeTab) return;
        // Persist current tab if desired

        if (isLinkTo !== "") {
            this.props.history.push(isLinkTo);
        }

        if (this.props.setting) {
            SettingsActions.changeViewSetting({
                [this.props.setting]: value
            });
        }
        this.setState({activeTab: value});

        if (this.props.onChangeTab) this.props.onChangeTab(value);
    }

    render() {
        let {children, contentClass, tabsClass, style, segmented} = this.props;
        const collapseTabs =
            this.state.width < 900 && React.Children.count(children) > 2;

        let activeContent = null;

        let tabs = React.Children.map(children, (child, index) => {
            if (!child) {
                return null;
            }
            if (collapseTabs && child.props.disabled) return null;
            let isActive = index === this.state.activeTab;
            if (isActive) {
                activeContent = child.props.children;
            }

            return React.cloneElement(child, {
                collapsed: collapseTabs,
                isActive,
                changeTab: this._changeTab.bind(this),
                index: index
            });
        }).filter(a => a !== null);

        if (!activeContent) {
            activeContent = tabs[0].props.children;
        }

        return (
            <div
                className={cnames(
                    !!this.props.actionButtons ? "with-buttons" : "",
                    this.props.className
                )}
            >
                <div className="service-selector">
                    <ul
                        style={style}
                        className={cnames("button-group no-margin", tabsClass, {
                            segmented
                        })}
                    >
                        {collapseTabs ? (
                            <li
                                style={{
                                    paddingLeft: 10,
                                    paddingRight: 10,
                                    minWidth: "15rem"
                                }}
                            >
                                <select
                                    value={this.state.activeTab}
                                    style={{marginTop: 10, marginBottom: 10}}
                                    className="bts-select"
                                    onChange={e => {
                                        let ind = parseInt(e.target.value, 10);
                                        this._changeTab(
                                            ind,
                                            e.target[ind].attributes[
                                                "data-is-link-to"
                                            ].value
                                        );
                                    }}
                                >
                                    {tabs}
                                </select>
                            </li>
                        ) : (
                            tabs
                        )}
                        {this.props.actionButtons ? (
                            <li className="tabs-action-buttons">
                                {this.props.actionButtons}
                            </li>
                        ) : null}
                    </ul>
                </div>
                <div className={cnames("tab-content", contentClass)}>
                    {activeContent}
                </div>
            </div>
        );
    }
}

Tabs = connect(Tabs, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {viewSettings: SettingsStore.getState().viewSettings};
    }
});

Tabs = withRouter(Tabs);

export {Tabs, Tab};
