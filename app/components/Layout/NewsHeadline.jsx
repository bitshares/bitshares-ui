import React from "react";
import {Alert, Icon} from "bitshares-ui-style-guide";
import {ChainStore, FetchChainObjects} from "bitsharesjs";
import asset_utils from "../../lib/common/asset_utils";
import {Carousel} from "antd";
import SettingsActions from "actions/SettingsActions";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import {getHeadFeedAsset} from "../../branding";

const filterNews = (news, hiddenNewsHeadline) => {
    return {
        ...Object.values(news).filter(item => {
            return hiddenNewsHeadline.indexOf(item.content);
        })
    };
};
class NewsHeadline extends React.Component {
    constructor() {
        super();
        this.state = {
            news: {},
            hiddenNewsHeadlineSize: 0
        };
    }

    componentDidMount() {
        this.getNewsThroughAsset(getHeadFeedAsset());
        //this.getNewsFromGitHub.call(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.hiddenNewsHeadline.size !== state.hiddenNewsHeadlineSize) {
            return {
                news: filterNews(state.news, props.hiddenNewsHeadline),
                hiddenNewsHeadlineSize: props.hiddenNewsHeadline.size
            };
        }
        return null;
    }

    shouldComponentUpdate(props, state) {
        return (
            Object.keys(this.state.news).length !==
                Object.keys(state.news).length ||
            props.hiddenNewsHeadline.size !== this.props.hiddenNewsHeadline.size
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
                        this.props.hiddenNewsHeadline
                    );
                    this.setState({news});
                }).bind(this)
            );
    }

    getNewsThroughAsset(listOfAssetSymbolOrId) {
        FetchChainObjects(ChainStore.getAsset, listOfAssetSymbolOrId).then(
            assets => {
                let notificationList = [];
                assets.forEach(asset => {
                    if (!asset) {
                        return;
                    }
                    try {
                        asset = asset.toJS();
                        let notification = asset_utils.parseDescription(
                            asset.options.description
                        );
                        if (!!notification.main) {
                            notification = notification.main.split(
                                "This asset is used to display notifications for the BitShares UI"
                            );
                            if (notification.length > 1 && !!notification[1]) {
                                notificationList.push(
                                    JSON.parse(notification[1])
                                );
                            }
                        }
                    } catch (err) {
                        console.error(
                            "Head feed could not be parsed from asset",
                            asset
                        );
                    }
                });
                const news = filterNews(
                    notificationList,
                    this.props.hiddenNewsHeadline
                );
                this.setState({news});
            }
        );
    }

    onClose(item) {
        SettingsActions.hideNewsHeadline(item);
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
                        {type === "info" || type === "warning" ? (
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

NewsHeadline = connect(
    NewsHeadline,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                hiddenNewsHeadline: SettingsStore.getState().hiddenNewsHeadline
            };
        }
    }
);

export default NewsHeadline;
