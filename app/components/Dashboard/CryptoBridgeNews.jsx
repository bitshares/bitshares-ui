import React from "react";
import {connect} from "alt-react";

import CryptoBridgeStore from "stores/CryptoBridgeStore";
import CryptoBridgeActions from "actions/CryptoBridgeActions";

import {FormattedDate} from "react-intl";

import LoadingIndicator from "../LoadingIndicator";

class CryptoBridgeNews extends React.Component {
    constructor() {
        super();

        this.state = {
            news: null
        };
    }

    componentWillMount() {
        CryptoBridgeActions.getNews.defer();
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.news !== nextProps.cryptoBridgeNews) {
            this.setState({news: nextProps.cryptoBridgeNews});
        }
    }

    render() {
        const {news} = this.state;

        if (!news) {
            return <LoadingIndicator type="three-bounce" />;
        }

        return (
            <div className="grid-block vertical medium-horizontal">
                {news.map((article, i) => {
                    return (
                        <div key={"newsArticle" + i} className="medium-6">
                            <article>
                                {article.img ? (
                                    <img
                                        src={article.img}
                                        style={{
                                            float: "left",
                                            maxHeight: "50px",
                                            marginRight: 10,
                                            marginBottom: 10
                                        }}
                                        alt=""
                                    />
                                ) : null}
                                <span
                                    style={{fontSize: "smaller", color: "#bbb"}}
                                >
                                    <FormattedDate
                                        value={article.date}
                                        year="numeric"
                                        month="long"
                                        day="2-digit"
                                    />
                                </span>
                                <h5>{article.title}</h5>
                                <p
                                    dangerouslySetInnerHTML={{
                                        __html: article.text
                                    }}
                                />
                            </article>
                        </div>
                    );
                })}
            </div>
        );
    }
}

export default connect(CryptoBridgeNews, {
    listenTo() {
        return [CryptoBridgeStore];
    },
    getProps() {
        return {
            cryptoBridgeNews: CryptoBridgeStore.getState().news
        };
    }
});
