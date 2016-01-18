import React from "react";
import {PropTypes} from "react-router";
import _ from "lodash";
import counterpart from "counterpart";
import utils from "common/utils";

let req = require.context("../../../../help", true, /\.md/);
let HelpData = {};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function split_into_sections(str) {
    let sections = str.split(/\[#\s?(.+?)\s?\]/);
    if (sections.length === 1) return sections[0];
    if (sections[0].length < 4) sections.splice(0, 1);
    sections = _.reduce(sections, (result, n) => {
        let last = result.length > 0 ? result[result.length-1] : null;
        if (!last || last.length === 2) { last = [n]; result.push(last); }
        else last.push(n);
        return result;
    }, []);
    return _.zipObject(sections);
}

function adjust_links(str) {
    return str.replace(/\<a\shref\=\"(.+?)\"/gi, (match, text) => {
        if (text.indexOf("#/") === 0) return `<a href="${text}" onclick="_onClickLink(event)"`;
        if (text.indexOf("http") === 0) return `<a href="${text}" target="_blank"`;
        let page = endsWith(text, ".md") ? text.substr(0, text.length - 3) : text;
        let res = `<a href="/#/help/${page}" onclick="_onClickLink(event)"`;
        return res;
    });
}

req.keys().forEach(function(filename) {
    var res = filename.match(/\/(.+?)\/(.+)\./);
    let locale = res[1];
    let key = res[2];
    let help_locale = HelpData[locale];
    if (!help_locale) HelpData[locale] = help_locale = {};
    let content = req(filename);
    help_locale[key] = split_into_sections(adjust_links(content));
});

//console.log("-- HelpData -->", HelpData);

class HelpContent extends React.Component {

    static propTypes = {
        path: React.PropTypes.string.isRequired,
        section: React.PropTypes.string
    }

    static contextTypes = {
        history: PropTypes.history
    }

    constructor(props) {
        super(props);
        window._onClickLink = this.onClickLink.bind(this);
    }

    onClickLink(e) {
        e.preventDefault();
        console.dir(e.target);
        let path = e.target.hash.split("/").filter(p => p && p !== "#");
        if (path.length === 0) return false;
        let route = "/" + path.join("/");
        this.context.history.pushState(null, route);
        return false;
    }

    setVars(str) {
        return str.replace(/(\{.+?\})/gi, (match, text) => {
            let key = text.substr(1, text.length - 2);
            let value = this.props[key] !== undefined ? this.props[key] : text;
            if (value.amount && value.asset) value = utils.format_asset(value.amount, value.asset, false, false);
            if (value.date) value = utils.format_date(value.date);
            if (value.time) value = utils.format_time(value.time);
            //console.log("-- var -->", key, value);
            return value;
        });
    }
    render() {
        let locale = this.props.locale || counterpart.getLocale() || "en";

        if (!HelpData[locale]) {
            console.error(`missing locale '${locale}' help files, rolling back to 'en'`);
            locale = "en";
        }
        let value = HelpData[locale][this.props.path];

        if (!value && locale != 'en') {
            console.warn(`missing path '${this.props.path}' for locale '${locale}' help files, rolling back to 'en'`);
            value = HelpData['en'][this.props.path];
        }
        if (!value && this.props.alt_path) {
            console.warn(`missing path '${this.props.path}' for locale '${locale}' help files, rolling back to alt_path '${this.props.alt_path}'`);
            value = HelpData[locale][this.props.alt_path];
        }
        if (!value && this.props.alt_path && locale != 'en') {
            console.warn(`missing alt_path '${this.props.alt_path}' for locale '${locale}' help files, rolling back to 'en'`);
            value = HelpData['en'][this.props.alt_path];
        }

        if (!value) {
            console.error(`help file not found '${this.props.path}' for locale '${locale}'`);
            return !null;
        }
        if (this.props.section) value = value[this.props.section];
        if (!value) {
            console.error(`help section not found ${this.props.path}#${this.props.section}`);
            return null;
        }
        return <div style={this.props.style} className="help-content" dangerouslySetInnerHTML={{__html: this.setVars(value)}}/>;
    }
}

export default HelpContent;
