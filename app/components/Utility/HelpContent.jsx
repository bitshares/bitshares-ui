import React from "react";
import {zipObject} from "lodash-es";
import counterpart from "counterpart";
import utils from "common/utils";
import {withRouter} from "react-router-dom";
import PropTypes from "prop-types";

let req = require.context("../../help", true, /\.md/);
let HelpData = {};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function split_into_sections(str) {
    let sections = str.split(/\[#\s?(.+?)\s?\]/);
    if (sections.length === 1) return sections[0];
    if (sections[0].length < 4) sections.splice(0, 1);

    for (let i = sections.length - 1; i >= 1; i -= 2) {
        // remove extra </p> and <p>
        sections[i] = sections[i].replace(/(^<\/p>|<p>$)/g, "");
        sections[i - 1] = [sections[i - 1], sections[i]];
        sections.splice(i, 1);
    }

    return zipObject(sections);
}

function adjust_links(str) {
    return str.replace(/\<a\shref\=\"(.+?)\"/gi, (match, text) => {
        text = utils.sanitize(text);

        if (text.indexOf((__HASH_HISTORY__ ? "#" : "") + "/") === 0)
            return `<a href="${text}" onclick="_onClickLink(event)"`;
        if (text.indexOf("http") === 0)
            return `<a href="${text}" rel="noopener noreferrer" class="external-link" target="_blank"`;
        let page = endsWith(text, ".md")
            ? text.substr(0, text.length - 3)
            : text;
        if (page.startsWith("/borrow")) {
            // pass
        } else if (!page.startsWith("/help")) {
            page = "/help/" + page;
        } else if (page.startsWith("help")) {
            page = "/" + page;
        }
        return `<a href="${
            __HASH_HISTORY__ ? "#" : ""
        }${page}" onclick="_onClickLink(event)"`;
    });
}

// console.log("-- HelpData -->", HelpData);

class HelpContent extends React.PureComponent {
    static propTypes = {
        path: PropTypes.string.isRequired,
        section: PropTypes.string
    };

    static defaultProps = {
        hide_issuer: "false"
    };

    constructor(props) {
        super(props);
        window._onClickLink = this.onClickLink.bind(this);
    }

    UNSAFE_componentWillMount() {
        let locale = this.props.locale || counterpart.getLocale() || "en";

        // Only load helpData for the current locale as well as the fallback 'en'
        req.keys()
            .filter(a => {
                return (
                    a.indexOf(`/${locale}/`) !== -1 || a.indexOf("/en/") !== -1
                );
            })
            .forEach(function(filename) {
                var res = filename.match(/\/(.+?)\/(.+)\./);
                let locale = res[1];
                let key = res[2];
                let help_locale = HelpData[locale];
                if (!help_locale) HelpData[locale] = help_locale = {};
                let content = req(filename).default;
                help_locale[key] = split_into_sections(adjust_links(content));
            });
    }

    onClickLink(e) {
        e.preventDefault();
        let path = (__HASH_HISTORY__ ? e.target.hash : e.target.pathname)
            .split("/")
            .filter(p => p && p !== "#");
        if (path.length === 0) return false;
        let route = "/" + path.join("/");
        this.props.history.push(route);
        return false;
    }

    setVars(str, hideIssuer) {
        if (hideIssuer == "true") {
            str = str.replace(/<p>[^<]*{issuer}[^<]*<\/p>/gm, "");
        }

        return str.replace(/(\{.+?\})/gi, (match, text) => {
            let key = text.substr(1, text.length - 2);
            let value = this.props[key] !== undefined ? this.props[key] : text;
            if (value && typeof value === "string")
                value = utils.sanitize(value);
            if (value.amount && value.asset)
                value = utils.format_asset(
                    value.amount,
                    value.asset,
                    false,
                    false
                );
            if (value.date) value = utils.format_date(value.date);
            if (value.time) value = utils.format_time(value.time);

            return value;
        });
    }

    render() {
        let locale = this.props.locale || counterpart.getLocale() || "en";
        if (!HelpData[locale]) {
            console.error(
                `missing locale '${locale}' help files, rolling back to 'en'`
            );
            locale = "en";
        }

        let value = HelpData[locale][this.props.path];

        if (!value && this.props.alt_path) {
            console.warn(
                `missing path '${this.props.path}' for locale '${locale}' help files, rolling back to alt_path '${this.props.alt_path}'`
            );
            value = HelpData[locale][this.props.alt_path];
        }

        if (!value && locale !== "en") {
            console.warn(
                `missing path '${this.props.path}' for locale '${locale}' help files, rolling back to 'en'`
            );
            value = HelpData["en"][this.props.path];
        }

        if (!value && this.props.alt_path && locale != "en") {
            console.warn(
                `missing alt_path '${this.props.alt_path}' for locale '${locale}' help files, rolling back to 'en'`
            );
            value = HelpData["en"][this.props.alt_path];
        }

        if (!value) {
            console.error(
                `help file not found '${this.props.path}' for locale '${locale}'`
            );
            return !null;
        }

        if (this.props.section) {
            /* The previously used remarkable-loader parsed the md properly as an object, the new one does not */
            for (let key in value) {
                if (!!key.match(this.props.section)) {
                    value = key.replace(
                        new RegExp("^" + this.props.section + ","),
                        ""
                    );
                    break;
                }
            }
        }

        if (!value) {
            console.error(
                `help section not found ${this.props.path}#${this.props.section}`
            );
            return null;
        }

        if (typeof value === "object") {
            console.error(
                `help section content invalid ${this.props.path}#${this.props.section}`
            );
            return null;
        }

        return (
            <div
                style={this.props.style}
                className="help-content"
                dangerouslySetInnerHTML={{
                    __html: this.setVars(value, this.props.hide_issuer)
                }}
            />
        );
    }
}

export default withRouter(HelpContent);
