import React from "react";
import {connect} from "alt-react";

import CryptoBridgeStore from "stores/CryptoBridgeStore";
import CryptoBridgeActions from "actions/CryptoBridgeActions";

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

        return <p dangerouslySetInnerHTML={{__html: news}} />;
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
