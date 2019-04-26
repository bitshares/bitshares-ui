import React from "react";
import {Alert} from "bitshares-ui-style-guide";

export default class GitNews extends React.Component {
    constructor() {
        super();
        this.state = {
            news: ""
        };
    }

    componentDidMount() {
        this.getNews.call(this);
    }

    getNews() {
        fetch(
            "https://api.github.com/repos/bitshares/bitshares-ui/contents/news.json"
        )
            .then(res => {
                return res.json();
            })
            .then(
                function(json) {
                    let news = JSON.parse(atob(json.content));
                    this.setState({news});
                }.bind(this)
            );
    }

    onClose = e => {
        console.log(e, "I was closed.");
    };

    render() {
        const {news} = this.state;
        return Object.keys(news).reduce((result, item) => {
            const now = Date.now();
            const begin = new Date(item.begin_date.split(".").reverse());
            const end = new Date(item.end_date.split(".").reverse());
            if (begin <= now && now <= end)
                return [
                    ...result,
                    <Alert
                        type={type}
                        message={item.content}
                        banner
                        closable={item.type === "notification"}
                        onClose={this.onClose}
                    />
                ];
        });
    }
}
