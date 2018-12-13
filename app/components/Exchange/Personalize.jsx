import {
    Button,
    Form,
    Select,
    Slider,
    Switch,
    Input,
    InputNumber,
    Modal,
    Icon
} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import React from "react";
import Translate from "react-translate-component";
import {GroupOrderLimitSelector} from "./OrderBook";
import SettingsActions from "actions/SettingsActions";

class Personalize extends React.Component {
    constructor(props) {
        super();
        this.state = {
            open: false,
            smallScreen: false,
            chartHeight: props.chartHeight,
            autoScroll: props.viewSettings.get("global_AutoScroll", true)
        };

        this.setChartHeight = this.setChartHeight.bind(this);
    }

    componentWillMount() {
        this.setState({
            smallScreen: window.innerWidth <= 800
        });
    }

    onClose() {
        this.props.hideModal();
    }

    setChartHeight(value) {
        this.setState({
            chartHeight: value
        });

        this.props.onChangeChartHeight({
            value: value
        });
    }

    setAutoscroll(target) {
        let newState = target == 1 ? true : false;

        this.setState({
            autoScroll: newState
        });

        SettingsActions.changeViewSetting({
            global_AutoScroll: newState
        });

        this.props.onSetAutoscroll(newState);
    }

    _getGroupingOptions(selectKey) {
        return (
            <Select
                placeholder={counterpart.translate(
                    "settings.placeholder_select"
                )}
                style={{width: "100%"}}
                onChange={this.props.onSetPanelTabs.bind(this, selectKey)}
                value={this.props.panelTabs[selectKey]}
            >
                <Select.Option value={0}>
                    <Translate content="exchange.settings.options.grouping_standalone" />
                </Select.Option>
                <Select.Option value={1}>
                    <Translate content="exchange.settings.options.grouping_1" />
                </Select.Option>
                <Select.Option value={2}>
                    <Translate content="exchange.settings.options.grouping_2" />
                </Select.Option>
            </Select>
        );
    }

    render() {
        let {chartType} = this.props;

        let {chartHeight} = this.state;

        return (
            <Modal
                title={counterpart.translate("exchange.settings.header.title")}
                visible={this.props.visible}
                id={this.props.modalId}
                overlay={true}
                footer={[
                    <Button key={"close"} onClick={this.onClose.bind(this)}>
                        {counterpart.translate("modal.close")}
                    </Button>
                ]}
                onCancel={this.onClose.bind(this)}
                noHeaderContainer
                ref={this.props.modalId}
            >
                <Form.Item>
                    <header>
                        <Translate content="exchange.settings.header.chart_options" />
                    </header>

                    {!this.props.tinyScreen ? (
                        <div className="grid-block no-overflow wrap shrink">
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.chart_type" />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.chart_type"
                                        )}
                                        type="question-circle"
                                        theme="filled"
                                    />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.chart_reload"
                                        )}
                                        type="info-circle"
                                        theme="filled"
                                    />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Select
                                    placeholder={counterpart.translate(
                                        "settings.placeholder_select"
                                    )}
                                    style={{width: "100%"}}
                                    value={chartType}
                                    onChange={this.props.onToggleChart.bind(
                                        this
                                    )}
                                >
                                    <Select.Option value="market_depth">
                                        {counterpart.translate(
                                            "exchange.order_depth"
                                        )}
                                    </Select.Option>
                                    <Select.Option value="price_chart">
                                        {counterpart.translate(
                                            "exchange.price_history"
                                        )}
                                    </Select.Option>
                                    <Select.Option value={"hidden_chart"}>
                                        {counterpart.translate(
                                            "exchange.settings.options.hidden_chart"
                                        )}
                                    </Select.Option>
                                </Select>
                            </div>
                        </div>
                    ) : null}

                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-6">
                            <h6 style={{margin: 9}}>
                                <Translate content="exchange.settings.title.chart_height" />
                                &nbsp;
                                <Icon
                                    data-tip={counterpart.translate(
                                        "exchange.settings.tooltip.chart_height"
                                    )}
                                    type="question-circle"
                                    theme="filled"
                                />
                            </h6>
                        </div>
                        <div className="small-6">
                            <InputNumber
                                value={
                                    typeof chartHeight === "number" &&
                                    chartHeight > 1000
                                        ? 1000
                                        : chartHeight
                                }
                                onChange={this.setChartHeight.bind(this)}
                            />
                        </div>
                    </div>

                    {!this.props.tinyScreen &&
                        chartType == "price_chart" && (
                            <div className="grid-block no-overflow wrap shrink">
                                <div className="small-6">
                                    <h6 style={{margin: 9}}>
                                        <Translate content="exchange.settings.title.chart_tools" />
                                        &nbsp;
                                        <Icon
                                            data-tip={counterpart.translate(
                                                "exchange.settings.tooltip.chart_tools"
                                            )}
                                            type="question-circle"
                                            theme="filled"
                                        />
                                        &nbsp;
                                        <Icon
                                            data-tip={counterpart.translate(
                                                "exchange.settings.tooltip.chart_reload"
                                            )}
                                            type="info-circle"
                                            theme="filled"
                                        />
                                    </h6>
                                </div>
                                <div className="small-6">
                                    <Switch
                                        style={{margin: 6}}
                                        checked={this.props.chartTools}
                                        onChange={this.props.onChartTools.bind(
                                            this
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                    {!this.props.tinyScreen &&
                        chartType == "price_chart" && (
                            <div className="grid-block no-overflow wrap shrink">
                                <div className="small-6">
                                    <h6 style={{margin: 9}}>
                                        <Translate content="exchange.settings.title.chart_zoom" />
                                        &nbsp;
                                        <Icon
                                            data-tip={counterpart.translate(
                                                "exchange.settings.tooltip.chart_zoom"
                                            )}
                                            type="question-circle"
                                            theme="filled"
                                        />
                                        &nbsp;
                                        <Icon
                                            data-tip={counterpart.translate(
                                                "exchange.settings.tooltip.chart_reload"
                                            )}
                                            type="info-circle"
                                            theme="filled"
                                        />
                                    </h6>
                                </div>
                                <div className="small-6">
                                    <Switch
                                        style={{margin: 6}}
                                        checked={this.props.chartZoom}
                                        onChange={this.props.onChartZoom.bind(
                                            this
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                    <header>
                        <Translate content="exchange.settings.header.order_options" />
                    </header>
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-6">
                            <h6 style={{margin: 9}}>
                                <Translate content="exchange.settings.title.order_book_grouping" />
                                &nbsp;
                                <Icon
                                    data-tip={counterpart.translate(
                                        "exchange.settings.tooltip.order_book_grouping"
                                    )}
                                    type="question-circle"
                                    theme="filled"
                                />
                            </h6>
                        </div>
                        <div className="small-6">
                            {this.props.trackedGroupsConfig ? (
                                <GroupOrderLimitSelector
                                    globalSettingsSelector={true}
                                    trackedGroupsConfig={
                                        this.props.trackedGroupsConfig
                                    }
                                    handleGroupOrderLimitChange={this.props.handleGroupOrderLimitChange.bind(
                                        this
                                    )}
                                    currentGroupOrderLimit={
                                        this.props.currentGroupOrderLimit
                                    }
                                />
                            ) : null}
                        </div>
                    </div>

                    {!this.props.tinyScreen &&
                        !this.props.smallScreen && (
                            <div className="grid-block no-overflow wrap shrink">
                                <div className="small-6">
                                    <h6 style={{margin: 9}}>
                                        <Translate content="exchange.settings.title.order_style" />
                                        &nbsp;
                                        <Icon
                                            data-tip={counterpart.translate(
                                                "exchange.settings.tooltip.order_style"
                                            )}
                                            type="question-circle"
                                            theme="filled"
                                        />
                                    </h6>
                                </div>
                                <div className="small-6">
                                    <Select
                                        placeholder={counterpart.translate(
                                            "settings.placeholder_select"
                                        )}
                                        style={{width: "100%"}}
                                        value={this.props.verticalOrderBook.toString()}
                                        onSelect={this.props.onMoveOrderBook.bind(
                                            this
                                        )}
                                    >
                                        <Select.Option value={"true"}>
                                            <Translate content="exchange.settings.options.vertical" />
                                        </Select.Option>
                                        <Select.Option value={"false"}>
                                            <Translate content="exchange.settings.options.horizontal" />
                                        </Select.Option>
                                    </Select>
                                </div>
                            </div>
                        )}

                    {/* Orientation Order Form */}
                    {(!this.props.tinyScreen &&
                        !this.props.verticalOrderBook) ||
                    this.props.smallScreen ? (
                        <div
                            className="grid-block no-overflow wrap shrink"
                            style={{paddingTop: "0.5em"}}
                        >
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.position_order_form" />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.position_order_form"
                                        )}
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Select
                                    placeholder={counterpart.translate(
                                        "settings.placeholder_select"
                                    )}
                                    style={{width: "100%"}}
                                    value={this.props.flipBuySell.toString()}
                                    onSelect={this.props.onFlipBuySell.bind(
                                        this
                                    )}
                                >
                                    <Select.Option value={"false"}>
                                        <Translate content="exchange.settings.options.position_order_form_opt1" />
                                    </Select.Option>
                                    <Select.Option value={"true"}>
                                        <Translate content="exchange.settings.options.position_order_form_opt2" />
                                    </Select.Option>
                                </Select>
                            </div>
                        </div>
                    ) : null}

                    {/* Orientation Order Book */}
                    {(!this.props.tinyScreen &&
                        !this.props.verticalOrderBook) ||
                    this.props.smallScreen ? (
                        <div
                            className="grid-block no-overflow wrap shrink"
                            style={{paddingTop: "0.5em"}}
                        >
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.position_order_orders" />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.position_order_orders"
                                        )}
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Select
                                    placeholder={counterpart.translate(
                                        "settings.placeholder_select"
                                    )}
                                    style={{width: "100%"}}
                                    value={this.props.flipOrderBook.toString()}
                                    onSelect={this.props.onFlipOrderBook.bind(
                                        this
                                    )}
                                >
                                    <Select.Option value={"false"}>
                                        <Translate content="exchange.settings.options.position_order_orders_opt1" />
                                    </Select.Option>
                                    <Select.Option value={"true"}>
                                        <Translate content="exchange.settings.options.position_order_orders_opt2" />
                                    </Select.Option>
                                </Select>
                            </div>
                        </div>
                    ) : null}

                    {/* Asset / Order Form Position */}
                    {(!this.props.tinyScreen &&
                        !this.props.verticalOrderBook) ||
                    this.props.smallScreen ? (
                        <div
                            className="grid-block no-overflow wrap shrink"
                            style={{paddingTop: "0.5em"}}
                        >
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.position_order_asset" />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.position_order_asset"
                                        )}
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Select
                                    placeholder={counterpart.translate(
                                        "settings.placeholder_select"
                                    )}
                                    style={{width: "100%"}}
                                    value={this.props.buySellTop.toString()}
                                    onSelect={this.props.onToggleBuySellPosition.bind(
                                        this
                                    )}
                                >
                                    <Select.Option value={"false"}>
                                        <Translate content="exchange.settings.options.position_order_asset_opt1" />
                                    </Select.Option>
                                    <Select.Option value={"true"}>
                                        <Translate content="exchange.settings.options.position_order_asset_opt2" />
                                    </Select.Option>
                                </Select>
                            </div>
                        </div>
                    ) : null}

                    {!this.props.tinyScreen && this.props.verticalOrderBook ? (
                        <div
                            className="grid-block no-overflow wrap shrink"
                            style={{paddingTop: "0.5em"}}
                        >
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.orderbook_auto_scroll" />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.orderbook_auto_scroll"
                                        )}
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Switch
                                    style={{margin: 6}}
                                    checked={this.state.autoScroll}
                                    onChange={this.setAutoscroll.bind(this)}
                                />
                            </div>
                        </div>
                    ) : null}

                    {!this.props.tinyScreen && this.props.verticalOrderBook ? (
                        <div className="grid-block no-overflow wrap shrink">
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.reverse_order_book" />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.reverse_order_book"
                                        )}
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Switch
                                    style={{margin: 6}}
                                    checked={this.props.orderBookReversed}
                                    onChange={this.props.onOrderBookReversed.bind(
                                        this
                                    )}
                                />
                            </div>
                        </div>
                    ) : null}

                    {!this.props.tinyScreen && (
                        <div className="grid-block no-overflow wrap shrink">
                            <div className="small-6" style={{paddingRight: 5}}>
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.single_colum_order_form" />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.single_colum_order_form"
                                        )}
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Switch
                                    style={{margin: 6}}
                                    checked={this.props.singleColumnOrderForm}
                                    onChange={this.props.onToggleSingleColumnOrderForm.bind(
                                        this
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {!this.props.tinyScreen && (
                        <header>
                            <Translate content="exchange.settings.header.panel_grouping" />
                            &nbsp;
                            <Icon
                                data-tip={counterpart.translate(
                                    "exchange.settings.tooltip.panel_grouping"
                                )}
                                type="question-circle"
                                theme="filled"
                            />
                        </header>
                    )}
                    {!this.props.tinyScreen && (
                        <div
                            className="grid-block no-overflow wrap shrink"
                            style={{paddingBottom: "0.5em"}}
                        >
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.my_trades" />
                                </h6>
                            </div>
                            <div className="small-6">
                                {this._getGroupingOptions("my_history")}
                            </div>
                        </div>
                    )}
                    {!this.props.tinyScreen && (
                        <div
                            className="grid-block no-overflow wrap shrink"
                            style={{paddingBottom: "0.5em"}}
                        >
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.market_trades" />
                                </h6>
                            </div>
                            <div className="small-6">
                                {this._getGroupingOptions("history")}
                            </div>
                        </div>
                    )}
                    {!this.props.tinyScreen && (
                        <div
                            className="grid-block no-overflow wrap shrink"
                            style={{paddingBottom: "0.5em"}}
                        >
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.open_orders" />
                                </h6>
                            </div>
                            <div className="small-6">
                                {this._getGroupingOptions("my_orders")}
                            </div>
                        </div>
                    )}
                    {!this.props.tinyScreen && (
                        <div
                            className="grid-block no-overflow wrap shrink"
                            style={{paddingBottom: "0.5em"}}
                        >
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.settlements" />
                                </h6>
                            </div>
                            <div className="small-6">
                                {this._getGroupingOptions("open_settlement")}
                            </div>
                        </div>
                    )}

                    {!this.props.tinyScreen && (
                        <header>
                            <Translate content="exchange.settings.header.general" />
                        </header>
                    )}

                    {!this.props.tinyScreen &&
                        !this.props.smallScreen && (
                            <div
                                className="grid-block no-overflow wrap shrink"
                                style={{paddingBottom: "0.5em"}}
                            >
                                <div
                                    className="small-6"
                                    style={{paddingRight: 5}}
                                >
                                    <h6 style={{margin: 9}}>
                                        <Translate content="exchange.settings.title.market_location" />
                                        &nbsp;
                                        <Icon
                                            data-tip={counterpart.translate(
                                                "exchange.settings.tooltip.market_location"
                                            )}
                                            type="question-circle"
                                            theme="filled"
                                        />
                                    </h6>
                                </div>
                                <div className="small-6">
                                    <Select
                                        placeholder={counterpart.translate(
                                            "settings.placeholder_select"
                                        )}
                                        style={{width: "100%"}}
                                        value={this.props.mirrorPanels.toString()}
                                        onSelect={this.props.onMirrorPanels.bind(
                                            this
                                        )}
                                    >
                                        <Select.Option value={"false"}>
                                            <Translate content="settings.left" />
                                        </Select.Option>
                                        <Select.Option value={"true"}>
                                            <Translate content="settings.right" />
                                        </Select.Option>
                                    </Select>
                                </div>
                            </div>
                        )}

                    {!this.props.tinyScreen && (
                        <div className="grid-block no-overflow wrap shrink">
                            <div className="small-6" style={{paddingRight: 5}}>
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.reduce_scrollbars" />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.reduce_scrollbars"
                                        )}
                                        type="question-circle"
                                        theme="filled"
                                    />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.reload"
                                        )}
                                        type="info-circle"
                                        theme="filled"
                                    />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Switch
                                    style={{margin: 6}}
                                    checked={this.props.hideScrollbars}
                                    onChange={this.props.onToggleScrollbars.bind(
                                        this
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {!this.props.tinyScreen && (
                        <div className="grid-block no-overflow wrap shrink">
                            <div className="small-6" style={{paddingRight: 5}}>
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.title.hide_function_buttons" />
                                    &nbsp;
                                    <Icon
                                        data-tip={counterpart.translate(
                                            "exchange.settings.tooltip.hide_function_buttons"
                                        )}
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Switch
                                    style={{margin: 6}}
                                    checked={this.props.hideFunctionButtons}
                                    onChange={this.props.onHideFunctionButtons.bind(
                                        this
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </Form.Item>
            </Modal>
        );
    }
}

export default Personalize;
