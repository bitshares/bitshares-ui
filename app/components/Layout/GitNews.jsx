import React from "react";
import {Alert, Icon} from "bitshares-ui-style-guide";
import {ChainStore, FetchChainObjects} from "bitsharesjs";
import asset_utils from "../../lib/common/asset_utils";
import {Carousel} from "antd";
import SettingsActions from "actions/SettingsActions";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";

const filterNews = (news, hiddenGitNews) => {
    return {
        ...Object.values(news).filter(item => {
            return item.type !== "info" || hiddenGitNews.indexOf(item.content);
        })
    };
};
class GitNews extends React.Component {
    constructor() {
        super();
        this.state = {
            news: {},
            hiddenGitNewsSize: 0
        };
    }

    componentDidMount() {
        //this.getNewsThroughAsset("NOTIFICATIONS");
        this.getNewsFromGitHub.call(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.hiddenGitNews.size !== state.hiddenGitNewsSize) {
            return {
                news: filterNews(state.news, props.hiddenGitNews),
                hiddenGitNewsSize: props.hiddenGitNews.size
            };
        }
        return null;
    }

    shouldComponentUpdate(props, state) {
        return (
            Object.keys(this.state.news).length !==
                Object.keys(state.news).length ||
            props.hiddenGitNews.size !== this.props.hiddenGitNews.size
        );
    }

    getNewsFromGitHub() {
        fetch(
            "https://api.github.com/repos/blockchainprojects/bitshares-ui/contents/news.json?ref=news_feed_on_the_very_top"
        )
            .then(res => {
                return res.json();
            })
            .then(
                (json => {
                    const news = filterNews(
                        JSON.parse(atob(json.content)),
                        this.props.hiddenGitNews
                    );
                    this.setState({news});
                }).bind(this)
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
                notification = filterNews(
                    JSON.parse(notification[1]),
                    this.props.hiddenGitNews
                );
                this.setState({news: [notification]});
            }
        );
    }

    onClose(item) {
        SettingsActions.hideGitNews(item);
    }

    render() {
        const {news} = this.state;
        if (!Object.keys(news).length) {
            return null;
        }
        const renderAlert = Object.values(news).reduce((acc, item, index) => {
            const now = new Date();
            const type = item.type === "critical" ? "error" : item.type; // info & warning
            const begin = new Date(item.begin_date.split(".").reverse());
            const end = new Date(item.end_date.split(".").reverse());
            if (now >= begin && now <= end) {
                acc = [
                    ...acc,
                    <div className="git-info" key={`git-alert${index}`}>
                        <Alert type={type} message={item.content} banner />
                        {type === "info" ? (
                            <Icon
                                type="close"
                                className="close-icon"
                                onClick={this.onClose.bind(this, item.content)}
                            />
                        ) : null}
                    </div>
                ];
            }
            return acc;
        }, []);
        return (
            <Carousel autoplaySpeed={15000} autoplay dots={false}>
                {renderAlert}
            </Carousel>
        );
    }
}

GitNews = connect(
    GitNews,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                hiddenGitNews: SettingsStore.getState().hiddenGitNews
            };
        }
    }
);

export default GitNews;
