import React from "react";
const TradingView = require("./charting_library.min.js");
import colors from "assets/colors";
import {getResolutionsFromBuckets} from "./tradingViewClasses";

// import {connect} from "alt-react";
// import MarketsStore from "stores/MarketsStore";

export default class TradingViewPriceChart extends React.Component {
    loadTradingView(props) {
        const {dataFeed} = props;
        let themeColors = colors[props.theme];

        if (!dataFeed) return;
        if (!!this.tvWidget) return;

        console.log(
            "currentResolution",
            getResolutionsFromBuckets([props.bucketSize])[0],
            "symbol",
            props.quoteSymbol + "_" + props.baseSymbol
        );

        dataFeed.update({
            resolutions: props.buckets,
            ticker: props.quoteSymbol + "_" + props.baseSymbol,
            interval: getResolutionsFromBuckets([props.bucketSize])[0]
        });

        console.log("*** Load Chart ***");
        console.time("*** Chart load time: ");
        this.tvWidget = new TradingView.widget({
            fullscreen: false,
            symbol: props.quoteSymbol + "_" + props.baseSymbol,
            interval: getResolutionsFromBuckets([props.bucketSize])[0],
            library_path: "/charting_library/",
            datafeed: dataFeed,
            container_id: "tv_chart",
            charts_storage_url: "http://saveload.tradingview.com",
            charts_storage_api_version: "1.1",
            client_id: "tradingview.com",
            user_id: "public_user_id",
            autosize: true,
            locale: props.locale,
            timezone: "Europe/Berlin",
            toolbar_bg: "#484848",
            overrides: {
                "paneProperties.background": themeColors.bgColor
            },
            theme: props.theme, // don't think this does anything yet
            custom_css_url: "custom-css.css",
            enabled_features: ["study_templates"],
            disabled_features: [
                "use_localstorage_for_settings",
                "header_saveload",
                "symbol_info",
                "border_around_the_chart",
                "header_symbol_search"
            ],
            debug: false
        });

        this.tvWidget.onChartReady(() => {
            console.log("*** Chart Ready ***");
            console.timeEnd("*** Chart load time: ");
            dataFeed.update({
                onMarketChange: this._setSymbol.bind(this)
            });
            /* For some reason these don't work if passed in the constructor */
            this.tvWidget.applyOverrides({
                "paneProperties.horzGridProperties.color":
                    themeColors.axisLineColor,
                "paneProperties.vertGridProperties.color":
                    themeColors.axisLineColor,
                "scalesProperties.lineColor": themeColors.axisLineColor,
                "scalesProperties.textColor": themeColors.textColor
            });
        });
    }

    componentWillReceiveProps(np) {
        if (!np.marketReady) return;
        if (!this.props.dataFeed && np.dataFeed) {
            loadTradingView(np);
        }
    }

    _setSymbol(ticker) {
        if (this.tvWidget) {
            this.tvWidget.setSymbol(
                ticker,
                getResolutionsFromBuckets([this.props.bucketSize])[0]
            );
        }
    }

    componentDidMount() {
        this.loadTradingView(this.props);
    }

    componentWillUnmount() {
        console.log("Unmounting, clear subs");
        this.props.dataFeed.clearSubs();
    }

    shouldComponentUpdate(np) {
        if (np.chartHeight !== this.props.chartHeight) return true;
        if (!!this.tvWidget) return false;
        if (!np.marketReady) return false;
        return true;
    }

    render() {
        return (
            <div className="small-12">
                <div
                    className="exchange-bordered"
                    style={{
                        height: this.props.chartHeight,
                        marginTop: 10,
                        marginBottom: 10
                    }}
                    id="tv_chart"
                />
            </div>
        );
    }
}
