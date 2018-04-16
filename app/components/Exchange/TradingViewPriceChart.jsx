import React from "react";
const TradingView = require("./charting_library.min.js");
import {DataFeed} from "./tradingViewClasses";

export default class TradingViewPriceChart extends React.Component {
    constructor(props) {
        super();
    }

    loadTradingView(props) {
        window.DEFAULT_SYMBOL = "TEST_OPEN";
        const datafeed = new DataFeed(props);
        console.log(
            "TradingView",
            TradingView,
            "datafeed",
            this.datafeed,
            "props",
            props
        );
        this.tvWidget = new TradingView.widget({
            fullscreen: false,
            symbol: props.quoteSymbol + "_" + props.baseSymbol,
            library_path: "/charting_library/",
            datafeed: datafeed,
            symbol: "",
            interval: "D",
            container_id: "tv_chart",
            debug: true,
            disabled_features: ["use_localstorage_for_settings"],
            enabled_features: ["study_templates"],
            charts_storage_url: "http://saveload.tradingview.com",
            charts_storage_api_version: "1.1",
            client_id: "tradingview.com",
            user_id: "public_user_id"
        });
    }

    componentDidMount() {
        this.loadTradingView(this.props);
    }

    shouldComponentUpdate() {
        if (!!this.tvWidget) return false;
        return true;
    }

    render() {
        return <div id="tv_chart" />;
    }
}
