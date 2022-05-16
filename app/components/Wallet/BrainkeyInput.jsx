import React, {Component} from "react";
import PropTypes from "prop-types";
import cname from "classnames";
import {hash, key} from "bitsharesjs";

var dictionary_set;

if (__ELECTRON__) {
    dictionary_set = new Set(
        require("common/dictionary_en.json").en.split(",")
    );
}

export default class BrainkeyInput extends Component {
    static propTypes = {
        onChange: PropTypes.func.isRequired
    };

    constructor() {
        super();
        this.state = {
            brnkey: "",
            loading: true
        };
    }

    UNSAFE_componentWillMount() {
        if (!__ELECTRON__) {
            fetch(`${__BASE_URL__}dictionary.json`)
                .then(reply => {
                    return reply.json().then(result => {
                        dictionary_set = new Set(result.en.split(","));
                        this.setState({
                            loading: false
                        });
                    });
                })
                .catch(err => {
                    console.log("fetch dictionary error:", err);
                });
        } else {
            this.setState({
                loading: false
            });
        }
    }

    _checkBrainKey() {
        let spellcheck_words = this.state.brnkey.split(" ");
        let checked_words = [];
        spellcheck_words.forEach((word, i) => {
            if (word === "") return;
            let spellcheckword = word.toLowerCase();
            spellcheckword = spellcheckword.match(/[a-z]+/); //just spellcheck letters
            if (
                spellcheckword === null ||
                dictionary_set.has(spellcheckword[0])
            )
                checked_words.push(
                    <span key={i} style={{padding: "1px", margin: "1px"}}>
                        {word}
                    </span>
                );
            else
                checked_words.push(
                    <MisspelledWord key={i}>{word}</MisspelledWord>
                );
        });
        // this.ready = checked_words.length > 0
        let word_count_label;
        let warn = true;
        let valid = true;
        if (checked_words.length > 0) {
            if (this.state.brnkey.length < 50) {
                word_count_label =
                    this.state.brnkey.length + " characters (50 minimum)";
                valid = false;
            } else {
                if (checked_words.length < 16)
                    word_count_label =
                        checked_words.length + " words (16 recommended)";
                else {
                    word_count_label = checked_words.length + " words";
                    warn = false;
                }
            }
        }

        return {warn, valid, word_count_label, checked_words};
    }

    render() {
        if (this.state.loading || !dictionary_set) {
            return <div style={{padding: 20}}>Fetching dictionary....</div>;
        }

        let {warn, word_count_label, checked_words} = this._checkBrainKey();

        return (
            <span className="">
                <div>
                    <textarea
                        tabIndex={this.props.tabIndex || 1}
                        onChange={this.formChange.bind(this)}
                        value={this.state.brnkey}
                        id="brnkey"
                        style={{height: 100, minWidth: 450}}
                    />
                    <div
                        style={{textAlign: "left"}}
                        className="grid-content no-padding no-overflow"
                    >
                        {checked_words}
                    </div>
                    {this.state.check_digits && !this.props.hideCheckDigits ? (
                        <div>
                            <br />
                            <pre className="no-overflow">
                                {this.state.check_digits} * Check Digits
                            </pre>
                            <br />
                        </div>
                    ) : null}
                    <p>
                        <i className={cname({error: warn})}>
                            {word_count_label}
                        </i>
                    </p>
                </div>
            </span>
        );
    }

    formChange(event) {
        var {id, value} = event.target;
        let {valid} = this._checkBrainKey();
        var state = {};
        state[id] = value;
        if (id === "brnkey") {
            var brnkey = key.normalize_brainKey(value);
            this.props.onChange(brnkey.length < 50 ? null : brnkey);
            state.check_digits =
                brnkey.length < 50
                    ? null
                    : hash
                          .sha1(brnkey)
                          .toString("hex")
                          .substring(0, 4);
        }
        this.setState(state);

        if (this.props.errorCallback) {
            this.props.errorCallback(valid);
        }
    }
}

class MisspelledWord extends Component {
    render() {
        return (
            <span
                style={{
                    borderBottom: "1px dotted #ff0000",
                    padding: "1px",
                    margin: "1px"
                }}
            >
                <span style={{borderBottom: "1px dotted #ff0000"}}>
                    {this.props.children}
                </span>
            </span>
        );
    }
}
