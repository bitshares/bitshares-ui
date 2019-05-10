import React from "react";
import {Alert} from "bitshares-ui-style-guide";

export default class GitNews extends React.Component {
    constructor() {
        super();
        this.state = {
            news: {}
        };
    }

    componentDidMount() {
        this.getNews.call(this);
    }

    getNews() {
        fetch(
            "https://api.github.com/repos/blockchainprojects/bitshares-ui/contents/news.json?ref=news_feed_on_the_very_top"
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

    render() {
        const {news} = this.state;
        const renderAlert = Object.keys(news).length
            ? Object.values(news).map((item, index) => {
                  let now = new Date();
                  const type = item.type === "critical" ? "error" : item.type;
                  const begin = new Date(item.begin_date.split(".").reverse());
                  const end = new Date(item.end_date.split(".").reverse());
                  if (now >= begin && now <= end)
                      return (
                          <Alert
                              key={index}
                              type={type}
                              message={item.content}
                              banner
                              closable={type === "info"}
                          />
                      );
              })
            : null;
        return renderAlert;
    }
}
