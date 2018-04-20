import React from "react";
const TradingView = require("./charting_library.min.js");
import colors from "assets/colors";
// import {connect} from "alt-react";
// import MarketsStore from "stores/MarketsStore";

export default class TradingViewPriceChart extends React.Component {
    constructor(props) {
        super();

        this.state = {
            marketChange: false
        };

        props.dataFeed.update({
            resolutions: props.buckets,
            ticker: props.quoteSymbol + "_" + props.baseSymbol,
            onMarketChange: this._setSymbol.bind(this)
        });
    }

    loadTradingView(props) {
        const {dataFeed} = props;
        let themeColors = colors[props.theme];

        if (!dataFeed) return;
        if (!!this.tvWidget) return;

        this.tvWidget = new TradingView.widget({
            fullscreen: false,
            symbol: props.quoteSymbol + "_" + props.baseSymbol,
            interval: "D",
            library_path: "/charting_library/",
            datafeed: dataFeed,
            symbol: "",
            container_id: "tv_chart",
            disabled_features: ["use_localstorage_for_settings"],
            enabled_features: ["study_templates"],
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
            custom_css_url: "custom-css.css",
            disabled_features: [
                "header_saveload",
                "symbol_info",
                "border_around_the_chart"
            ],
            debug: false
        });

        this.tvWidget.onChartReady(() => {
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
        if (this.tvWidget) this.tvWidget.setSymbol(ticker, "D");
    }

    componentDidMount() {
        this.loadTradingView(this.props);
    }

    componentWillUnmount() {
        this.props.dataFeed.clearSubs();
    }

    shouldComponentUpdate(np) {
        if (np.chartHeight !== this.props.chartHeight) return true;
        if (!!this.tvWidget) return false;
        if (!this.props.marketReady && !np.marketReady) return false;
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
