/**
 * MessageComposer component
 *
 * Renders a rich text editor.
 */
import React from "react";
import counterpart from "counterpart";

class MessageComposer extends React.Component {
    state = {
        value: ""
    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.value) {
            this.setState({value});
        }
    }

    /**
     * Resets the rich text editor state
     */
    reset = () => {
        this.setState({
            value: ""
        });
    };

    /**
     * Converts a HTMl List to Wiki format
     *
     * @param html
     * @returns {*}
     * @private
     */
    _htmlListToWiki = html => {
        let level = 0;
        let symbols = "";
        let startText = "";

        return html
            .split(/(?=<\/?ul>|<\/?ol>)/gi)
            .map(line => {
                startText = line.substr(0, 4);

                if (startText === "<ol>") {
                    level += 1;
                    symbols = startText === "<ol>" ? `${symbols}#` : symbols;
                } else if (startText === "<ul>") {
                    level += 1;
                    symbols = startText === "<ul>" ? `${symbols}*` : symbols;
                } else if (["</ol", "</ul"].indexOf(startText) !== -1) {
                    level -= 1;
                }

                return line
                    .replace(/<li>/gi, `${symbols.substr(0, level)} `)
                    .replace(/<(u|o)l>/gi, level === 1 ? "\n\n" : "\n")
                    .replace(/<\/(u|o)l>?<\/li>/gi, "\n")
                    .replace(/<\/li>\*/gi, "\n*")
                    .replace(/<\/(u|o)l>/gi, "\n");
            })
            .join("")
            .replace(/<\/li>/gi, "");
    };

    /**
     * Converts HTML to Wiki format
     *
     * @param html
     * @returns {*}
     * @private
     */
    _htmlToWiki = html => {
        const mapObj = {
            "<del>": "-",
            "</del>": "-",
            "<em>": "_",
            "</em>": "_",
            "<b>": "*",
            "</b>": "*",
            "<u>": "+",
            "</u>": "+",
            "<strong>": "*",
            "</strong>": "*",
            "<cite>": "??",
            "</cite>": "??",
            "<ins>": "+",
            "</ins>": "+",
            "<sup>": "^",
            "</sup>": "^",
            "<sub>": "~",
            "</sub>": "~",
            "<tt>": "{{",
            "</tt>": "}}",
            "<blockquote>": "{quote}",
            "</blockquote>": "{quote}",
            "<h1>": "h1. ",
            "</h1>": "",
            "<h2>": "h2. ",
            "</h2>": "",
            "<h3>": "h3. ",
            "</h3>": "",
            "<h4>": "h4. ",
            "</h4>": "",
            "<h5>": "h5. ",
            "</h5>": "",
            "<h6>": "h6. ",
            "</h6>": "",
            "<br/>": "\n\n",
            "<br>": "\n\n",
            "<p>": "",
            "</p>": "\n\n",
            "<hr>": "----",
            "<hr/>": "----",
            "&mdash;": "---",
            "&#8212;": "---",
            "&ndash;": "--",
            "&#8211;": "--"
        };

        let replacedHtml = html.replace(/\s+(?=<\/?(?:ol|ul|li))/gi, "");

        const needles = Object.keys(mapObj)
            .map(
                key =>
                    key.indexOf("/") !== -1
                        ? key.replace(/\s*\//gi, "[^>]*\\/")
                        : key.replace(">", "[^>]*>")
            )
            .join("|");

        /* strip out white space before HTML tags */
        //replacedHtml = replacedHtml.replace(/(\\n|\\r)/gi, "");

        replacedHtml = this._htmlListToWiki(replacedHtml);

        /* replace HTML tags for Wiki equivalents */
        replacedHtml = replacedHtml.replace(
            new RegExp(needles, "gi"),
            match => {
                return mapObj[match.replace(/\s*/gi, "")];
            }
        );

        /* generate Wiki links from anchors */
        replacedHtml = replacedHtml.replace(
            /<a\s+.*href="\s*(.*)\s*"\s*>\s*(.*)\s*<\/a\s*>/gi,
            (orig, match1, match2) => {
                return `[${match2 ? `${match2}|` : ""}${match1}]`;
            }
        );

        return replacedHtml;
    };

    /**
     * Handles change of rich text editor state
     *
     * @param editorState
     * @private
     */
    _onChange = event => {
        const value = event.target.value;

        this.setState({value});

        if (this.props.onChange) {
            // value.replace(/(\n|\r)/gi
            this.props.onChange(this._htmlToWiki(value));
        }
    };

    render() {
        const {value} = this.state;

        return (
            <textarea
                placeholder={counterpart.translate(
                    "cryptobridge.support.enter_your_reply"
                )}
                value={value}
                onChange={this._onChange}
                style={{minHeight: 100}}
            />
        );
    }
}

export default MessageComposer;
