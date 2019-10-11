import React from "react";
import Translate from "react-translate-component";
import cnames from "classnames";
import {isArray, isString} from "lodash-es";
import Icon from "../Icon/Icon";
import MenuItemType from "./MenuItemType";

class DropdownMenuItem extends React.Component {
    render() {
        const {
            target,
            currentPath,
            includePattern,
            excludePattern,
            additionalClassName,
            icon,
            text,
            behavior,
            submenu, // {target, text, disabled} || [{target, text, hidden}]
            hidden,
            disabled
        } = this.props;

        let actualIcon = icon;
        if (isString(icon)) {
            actualIcon = {name: icon};
        }

        // Default icon title if not set
        if (actualIcon && !actualIcon.title) {
            actualIcon.title = "icons." + actualIcon.name;
        }

        // Default icon size if not set
        if (actualIcon && !actualIcon.size) {
            actualIcon.size = "2x";
        }

        // Convert sigle strings to array
        let includePatternArray = includePattern;
        if (isString(includePattern)) {
            includePatternArray = [includePattern];
        }

        let excludePatternArray = excludePattern;
        if (isString(excludePattern)) {
            excludePatternArray = [excludePattern];
        }

        // Check patterns which decides should the class names be assigned or not
        let patternMatched = false;
        if (includePattern || excludePattern) {
            patternMatched = true;

            if (includePatternArray) {
                for (let i = 0; i < includePatternArray.length; i++) {
                    if (currentPath.indexOf(includePatternArray[i]) === -1) {
                        patternMatched = false;
                        break;
                    }
                }
            }

            if (excludePatternArray) {
                for (let i = 0; i < excludePatternArray.length; i++) {
                    if (currentPath.indexOf(excludePatternArray[i]) !== -1) {
                        patternMatched = false;
                        break;
                    }
                }
            }
        }

        // Choose a behavior, defaults to Always
        let actualBehavior = MenuItemType.Always;
        if (behavior) {
            actualBehavior = behavior;
        }

        // Show or hide element by it's behavior
        let actuallyHidden = true;
        if (
            actualBehavior == MenuItemType.Always ||
            (actualBehavior == MenuItemType.Dynamic && patternMatched)
        ) {
            actuallyHidden = false;
        }

        //But also count a direct hidding
        if (hidden) {
            actuallyHidden = true;
        }

        // Click handler for disabled elements
        const emptyClickHandler = event => {
            event.stopPropagation();
        };

        // If submenu is a single object, render it as pure link
        let renderAlternativeSubmenu = submenu && !isArray(submenu);

        return actuallyHidden ? null : (
            <li
                className={cnames(
                    {
                        active: patternMatched,
                        disabled: disabled,
                        "has-submenu": isArray(submenu)
                    },
                    additionalClassName
                )}
                onClick={disabled ? emptyClickHandler : target}
            >
                {actualIcon && (
                    <div className="table-cell">
                        <Icon
                            size={actualIcon.size}
                            name={actualIcon.name}
                            title={actualIcon.title}
                        />
                    </div>
                )}
                <div className="table-cell">
                    <Translate content={text} />

                    {renderAlternativeSubmenu ? " " : null}
                    {renderAlternativeSubmenu ? (
                        <span
                            onClick={
                                submenu.disabled
                                    ? emptyClickHandler
                                    : event => {
                                          event.stopPropagation();
                                          submenu.target(event);
                                      }
                            }
                            className={cnames("header-dropdown-sub-link", {
                                enabled: !submenu.disabled
                            })}
                        >
                            <Translate content={submenu.text} />
                        </span>
                    ) : null}
                </div>
            </li>
        );
    }
}

export default DropdownMenuItem;
