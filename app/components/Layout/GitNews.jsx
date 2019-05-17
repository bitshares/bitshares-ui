import React from "react";
import {Alert} from "bitshares-ui-style-guide";
import {ChainStore, FetchChainObjects} from "bitsharesjs";
import asset_utils from "../../lib/common/asset_utils";
import {Carousel} from "antd";

export default class GitNews extends React.Component {
    constructor() {
        super();
        this.state = {
            news: {}
        };
    }

    componentDidMount() {
        //this.getNewsThroughAsset("NOTIFICATIONS");
        this.getNewsFromGitHub.call(this);
    }

    getNewsFromGitHub() {
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

    getNewsThroughAsset(assetSymbolOrId) {
        FetchChainObjects(ChainStore.getAsset, [assetSymbolOrId]).then(
            asset => {
                asset = asset[0].toJS();
                console.log(asset);
                let notification = asset_utils.parseDescription(
                    asset.options.description
                );
                notification = notification.main.split(
                    "This asset is used to display notifications for the BitShares UI deployed under bitshares.org"
                );
                notification = JSON.parse(notification[1]);
                this.setState({news: [notification]});
            }
        );
    }

    render() {
        const {news} = this.state;
        if (!Object.keys(news).length) {
            return null;
        }
        const renderAlert = Object.values(news).map((item, index) => {
            let now = new Date();
            const type = item.type === "critical" ? "error" : item.type; // info & warning
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
                        className="git-info"
                    />
                );
        });
        return (
            <Carousel autoplaySpeed={15000} autoplay dots={false}>
                {renderAlert}
            </Carousel>
        );
    }
}
