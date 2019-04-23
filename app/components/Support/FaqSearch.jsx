/**
 * FAQ Search component
 *
 * Renders an FAQ Search component. Results matching the search criteria are fetched from the API,
 * and rendered as a list with clickable links.
 */
import React from "react";
import counterpart from "counterpart";
import {log} from "./SupportUtils";
import {getRequestAccessOptions} from "lib/common/AccountUtils";
import LoadingIndicator from "../LoadingIndicator";

class FaqSearch extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            fetching: false,
            searchResults: [],
            searchTerm: props.searchTerm || ""
        };
    }

    componentWillReceiveProps(np) {
        if (np.searchTerm !== this.props.searchTerm) {
            this.setState({searchTerm: np.searchTerm});
        }
    }

    /**
     * Fetch search results from the Freshdesk API matching the supplied search term
     *
     * @param searchTerm
     * @private
     */
    _fetchSearchResults = searchTerm => {
        this.setState({fetching: true});

        return fetch(
            `${__API_SUPPORT_URL__}/faq/search?q=${searchTerm}`,
            Object.assign(getRequestAccessOptions(this.props.accountAccess), {
                method: "GET"
            })
        )
            .then(response => response.json())
            .then(response => {
                const searchResults = response.map(article => {
                    return {
                        id: article.id,
                        type: article.type,
                        title: article.title,
                        text: article.description_text,
                        url: `https://cryptobridge.freshdesk.com//support/solutions/articles/${
                            article.id
                        }`
                    };
                });

                this.setState({
                    searchResults,
                    fetching: false
                });
            })
            .catch(error => {
                log(
                    `FaqSearch.jsx:_fetchSearchResults() - FAQ API fetch promise catch() (${error})`
                );

                this.setState({
                    fetching: false
                });
            });
    };

    _handleSearch(value) {
        if (this.fetchTimeout) {
            clearTimeout(this.fetchTimeout);
        }

        this.fetchTimeout = setTimeout(() => {
            this._fetchSearchResults(value);
        }, 350);
    }

    /**
     * Handles the search text change event
     *
     * @param event
     * @private
     */
    _handleSearchTextChange = event => {
        const {value} = event.target;

        this._handleSearch(value);

        this.setState({searchTerm: value});

        if (this.props.onChange) {
            this.props.onChange(value);
        }
    };

    /**
     * Renders the search results list
     *
     * @returns {null}
     * @private
     */
    _renderSearchResults = () => {
        return this.state.searchResults.length > 0 ? (
            <div className="search-results__wrapper">
                <ol className="search-results">
                    {this.state.searchResults.map((result, index) => {
                        return (
                            <li
                                key={`search-result-${index}`}
                                className="search-result__item"
                            >
                                <a
                                    href={result.url}
                                    className="search-result__link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                        window.open(result.url, "_blank");
                                    }}
                                >
                                    <div
                                        className="search-result__title"
                                        dangerouslySetInnerHTML={{
                                            __html: result.title
                                        }}
                                    />
                                    <div
                                        className="search-result__text"
                                        dangerouslySetInnerHTML={{
                                            __html: result.text
                                        }}
                                    />
                                </a>
                            </li>
                        );
                    })}
                </ol>
            </div>
        ) : null;
    };

    render() {
        return (
            <div className="faq-search">
                <div>
                    <label
                        htmlFor="faq_search"
                        style={{marginBottom: 0, position: "relative"}}
                    >
                        <input
                            id="faq_search"
                            type="text"
                            placeholder={counterpart.translate(
                                "cryptobridge.support.faq_search_placeholder"
                            )}
                            aria-label={counterpart.translate(
                                "cryptobridge.support.faq_search_aria_label"
                            )}
                            onChange={this._handleSearchTextChange}
                            value={this.state.searchTerm}
                            style={{marginBottom: 0}}
                        />
                        {this.state.fetching && (
                            <div
                                style={{position: "absolute", right: 7, top: 7}}
                            >
                                <LoadingIndicator type={"circle"} />
                            </div>
                        )}
                    </label>
                </div>
                {this._renderSearchResults()}
            </div>
        );
    }
}

export default FaqSearch;
