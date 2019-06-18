import React from "react";
const TradingView = require("../../../charting_library/charting_library.min.js");
import colors from "assets/colors";
import {getResolutionsFromBuckets, getTVTimezone} from "./tradingViewClasses";
import {Modal, Input, Table, Button, Icon} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import {connect} from "alt-react";

// import MarketsStore from "stores/MarketsStore";

class TradingViewPriceChart extends React.Component {
    constructor(props) {
        super();
        this.state = {
            showSaveModal: false,
            showLoadModal: false
        };
        this.layoutName = React.createRef();
        this.hideModal = this.hideModal.bind(this);
    }
    loadTradingView(props) {
        const {dataFeed} = props;
        let themeColors = colors[props.theme];
        const that = this;

        if (!dataFeed) return;
        if (!!this.tvWidget) return;

        if (__DEV__)
            console.log(
                "currentResolution",
                getResolutionsFromBuckets([props.bucketSize])[0],
                "symbol",
                props.quoteSymbol + "_" + props.baseSymbol,
                "timezone:",
                getTVTimezone()
            );

        dataFeed.update({
            resolutions: props.buckets,
            ticker: props.quoteSymbol + "_" + props.baseSymbol,
            interval: getResolutionsFromBuckets([props.bucketSize])[0]
        });

        let disabled_features = [
            "symbol_info",
            "symbol_search_hot_key",
            "border_around_the_chart",
            "header_symbol_search",
            "header_compare",
            "header_saveload"
        ];

        let enabled_features = [];

        if (this.props.mobile || !this.props.chartZoom) {
            disabled_features.push("chart_scroll");
            disabled_features.push("chart_zoom");
        }

        if (this.props.mobile || !this.props.chartTools) {
            disabled_features.push("left_toolbar");
            disabled_features.push("chart_crosshair_menu");
            disabled_features.push("chart_events");
            disabled_features.push("footer_share_buttons");
            disabled_features.push("footer_screenshot");
            disabled_features.push("footer_publish_idea_button");
            disabled_features.push("caption_buttons_text_if_possible");
            disabled_features.push("line_tool_templates");
            disabled_features.push("widgetbar_tabs");
            disabled_features.push("support_manage_drawings");
            disabled_features.push("support_multicharts");
            disabled_features.push("right_bar_stays_on_scroll");
            disabled_features.push("charts_auto_save");
            disabled_features.push("edit_buttons_in_legend");
            disabled_features.push("context_menus");
            disabled_features.push("control_bar");
            disabled_features.push("header_fullscreen_button");
            disabled_features.push("header_widget");
            disabled_features.push("symbollist_context_menu");
            disabled_features.push("show_pro_features");
        } else {
            enabled_features.push("study_templates");
            enabled_features.push("keep_left_toolbar_visible_on_small_screens");
        }

        if (__DEV__) console.log("*** Load Chart ***");
        if (__DEV__) console.time("*** Chart load time: ");

        this.tvWidget = new TradingView.widget({
            fullscreen: false,
            symbol: props.quoteSymbol + "_" + props.baseSymbol,
            interval: getResolutionsFromBuckets([props.bucketSize])[0],
            library_path: `${
                __ELECTRON__ ? __BASE_URL__ : ""
            }/charting_library/`,
            datafeed: dataFeed,
            container_id: "tv_chart",
            charts_storage_url: "https://saveload.tradingview.com",
            charts_storage_api_version: "1.1",
            client_id: "tradingview.com",
            user_id: "public_user_id",
            autosize: true,
            locale: props.locale,
            timezone: getTVTimezone(),
            toolbar_bg: themeColors.bgColor,
            overrides: {
                "paneProperties.background": themeColors.bgColor,
                "paneProperties.horzGridProperties.color":
                    themeColors.axisLineColor,
                "paneProperties.vertGridProperties.color":
                    themeColors.axisLineColor,
                "scalesProperties.lineColor": themeColors.axisLineColor,
                "scalesProperties.textColor": themeColors.textColor
            },
            custom_css_url: props.theme + ".css",
            enabled_features: enabled_features,
            disabled_features: disabled_features,
            debug: false,
            preset: this.props.mobile ? "mobile" : ""
        });

        this.tvWidget.onChartReady(() => {
            if (__DEV__) console.log("*** Chart Ready ***");
            if (__DEV__) console.timeEnd("*** Chart load time: ");
            this.tvWidget
                .createButton()
                .attr("title", "Load custom charts")
                .on("click", () => {
                    that.setState({showLoadModal: true});
                })
                .append("<span>Load Chart</span>");
            this.tvWidget
                .createButton()
                .attr("title", "Save Custom charts")
                .on("click", () => {
                    that.setState({showSaveModal: true});
                })
                .append("<span>Save Chart</span>");

            dataFeed.update({
                onMarketChange: this._setSymbol.bind(this)
            });
        });

        this._onWheel = this._onWheel.bind(this);
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

        // continue investigating how to disable mouse wheel, here are the containted docs
        // document.getElementById("tv_chart").children[0].contentWindow
        // document.getElementById("tv_chart").children[0].contentDocument
    }

    componentWillUnmount() {
        this.props.dataFeed.clearSubs();
    }

    shouldComponentUpdate(np, state) {
        return (
            state.showLoadModal !== this.state.showLoadModal ||
            state.showSaveModal !== this.state.showSaveModal ||
            np.chartHeight !== this.props.chartHeight ||
            this.props.charts.size !== np.charts.size ||
            !this.tvWidget ||
            np.marketReady
        );
    }

    _onWheel(e) {
        console.log("Test wheel interception");
    }

    onSubmitConfirmation(e) {
        const {layoutName} = this;
        const that = this;
        this.tvWidget.save(function(object) {
            let chart = {};
            chart.key = layoutName.current.state.value || "";
            chart.object = object;
            chart.name = layoutName.current.state.value || "";
            chart.symbol =
                that.props.quoteSymbol + " / " + that.props.baseSymbol;
            chart.modified = new Date().toLocaleDateString("en-US");
            SettingsActions.addChartLayout(chart);
            that.setState({showSaveModal: false}, () => {
                if (that.layoutName.current.state) {
                    that.layoutName.current.state.value = null;
                }
            });
        });
    }
    hideModal() {
        this.setState({showSaveModal: false, showLoadModal: false});
    }

    handleDelete(name) {
        SettingsActions.deleteChartLayout(name);
    }

    render() {
        const columns = [
            {
                title: "Layout Name",
                dataIndex: "name",
                key: "name"
            },
            {
                title: "Modified",
                dataIndex: "modified",
                key: "modified"
            },
            {
                title: "Active Symbol",
                dataIndex: "symbol",
                key: "symbol"
            },
            {
                title: "Actions",
                dataIndex: "actions",
                key: "actions",
                render: (text, record) => {
                    return (
                        <Icon
                            style={{width: "32px"}}
                            onClick={this.handleDelete.bind(this, record.name)}
                            type="delete"
                        />
                    );
                }
            }
        ];

        const onRow = record => {
            return {
                onClick: event => {
                    if (!event.target.dataset.icon) {
                        this.hideModal();
                        this.tvWidget.load(record.object);
                    } else if (
                        event.target.parentElement.childElementCount === 1
                    )
                        this.hideModal();
                }
            };
        };

        return (
            <div className="small-12">
                <div
                    className="exchange-bordered"
                    style={{height: this.props.chartHeight + "px"}}
                    id="tv_chart"
                />
                <Modal
                    title={"Load Chart Layout"}
                    closable={false}
                    visible={this.state.showLoadModal}
                    footer={[
                        <Button key="cancel" onClick={this.hideModal}>
                            {counterpart.translate("modal.close")}
                        </Button>
                    ]}
                >
                    <Table
                        dataSource={this.props.charts.toArray() || []}
                        columns={columns}
                        onRow={onRow}
                    />
                </Modal>
                <Modal
                    title={"Save New Chart Layout "}
                    closable={false}
                    visible={this.state.showSaveModal}
                    footer={[
                        <Button
                            key="submit"
                            type="primary"
                            onClick={this.onSubmitConfirmation.bind(this)}
                        >
                            {counterpart.translate("modal.save")}
                        </Button>,
                        <Button key="cancel" onClick={this.hideModal}>
                            {counterpart.translate("modal.close")}
                        </Button>
                    ]}
                >
                    <Input
                        placeholder="Enter Chart Layout Name"
                        ref={this.layoutName}
                        onPressEnter={this.onSubmitConfirmation.bind(this)}
                    />
                </Modal>
            </div>
        );
    }
}

export default connect(
    TradingViewPriceChart,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                charts: SettingsStore.getState().chartLayouts
            };
        }
    }
);
