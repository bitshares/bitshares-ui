import React from "react";
import Translate from "react-translate-component";
import cnames from "classnames";
import {isFunction, isString} from "lodash-es";
import Icon from "../Icon/Icon";
import MenuItemType from "./MenuItemType";

class HeaderMenuItem extends React.Component {
    render() {
        const {
            target,
            currentPath,
            includePattern,
            excludePattern,
            hideClassName,
            icon,
            text,
            behavior,
            hidden
        } = this.props;

        // Either click handler or navigation path
        let clickHandler = undefined;
        if (isFunction(target)) {
            clickHandler = target;
        }

        let href = undefined;
        if (isString(target)) {
            href = target;
        }

        // Defalut icon title if not set
        if (!icon.title) {
            icon.title = "icons." + icon.name;
        }

        // Default icon size if not set
        if (!icon.size) {
            icon.size = "1_5x";
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

            if (patternMatched) {
                actualHideClass = hideClassName;
            }
        }

        let actualHideClass = undefined;
        if (hideClassName && patternMatched) {
            actualHideClass = hideClassName;
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

        return actuallyHidden ? null : (
            <li>
                <a
                    style={{flexFlow: "row"}}
                    className={cnames(actualHideClass, {
                        active: patternMatched
                    })}
                    onClick={clickHandler}
                    href={href}
                >
                    <Icon
                        size={icon.size}
                        style={{
                            position: "relative",
                            top: 0,
                            left: -8
                        }}
                        name={icon.name}
                        title={icon.title}
                    />
                    <Translate
                        className="column-hide-small"
                        component="span"
                        content={text}
                    />
                </a>
            </li>
        );
    }
}

export default HeaderMenuItem;
