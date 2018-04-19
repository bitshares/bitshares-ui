import React from "react";
const TradingView = require("./charting_library.min.js");
import {connect} from "alt-react";
import MarketsStore from "stores/MarketsStore";

class TradingViewPriceChart extends React.Component {
    constructor() {
        super();
    }

    loadTradingView(props) {
        const {dataFeed} = props;
        console.log("TradingView", TradingView, "props", props);

        if (!dataFeed) return;

        this.tvWidget = new TradingView.widget({
            fullscreen: false,
            symbol: props.quoteSymbol + "_" + props.baseSymbol,
            library_path: "/charting_library/",
            datafeed: dataFeed,
            symbol: "",
            interval: "D",
            container_id: "tv_chart",
            debug: true,
            disabled_features: ["use_localstorage_for_settings"],
            enabled_features: ["study_templates"],
            charts_storage_url: "http://saveload.tradingview.com",
            charts_storage_api_version: "1.1",
            client_id: "tradingview.com",
            user_id: "public_user_id",
            autosize: true
        });
    }

    componentWillReceiveProps(np) {
        if (!this.props.dataFeed && np.dataFeed) {
            loadTradingView(np);
        }
    }

    componentDidMount() {
        this.loadTradingView(this.props);
    }

    shouldComponentUpdate() {
        if (!!this.tvWidget) return false;
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

export default connect(TradingViewPriceChart, {
    listenTo() {
        return [MarketsStore];
    },
    getProps() {
        return {dataFeed: MarketsStore.getState().dataFeed};
    }
});
