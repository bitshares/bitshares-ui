import {
    Col, Row,
    Button,
    Select, 
    Slider,
    Switch,
    Input,
    InputNumber
} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import BaseModal from "../Modal/BaseModal";
import {GroupOrderLimitSelector} from "./OrderBook";
import SettingsActions from "actions/SettingsActions";

class Settings extends React.Component {
    constructor(props) {
        super();
        this.state = {
            open: false,
            smallScreen: false,
            chartHeight: props.chartHeight,
            autoScroll: props.viewSettings.get("global_AutoScroll", true),
        };

        this.setChartHeight = this.setChartHeight.bind(this);
    }

    componentWillMount() {
        this.setState({
            smallScreen: window.innerWidth <= 800
        });
    }

    show() {
        this.setState({open: true}, () => {
            ZfApi.publish(this.props.modalId, "open");
        });
    }

    onClose() {
        this.setState({open: false}, () => { 
            this.props.onToggleSettings();
        });
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
                placeholder={counterpart.translate("settings.placeholder_select")}
                style={{width: "100%"}}
                onChange={this.props.onSetPanelTabs.bind(this, selectKey)}
                value={this.props.panelTabs[selectKey]}
            >
                <Select.Option value={0}>
                    <Translate content="exchange.settings.grouping_standalone" />
                </Select.Option>
                <Select.Option value={1}>
                    <Translate content="exchange.settings.grouping_1" />
                </Select.Option>
                <Select.Option value={2}>
                    <Translate content="exchange.settings.grouping_2" />
                </Select.Option>
            </Select>
        );
    }

    render() {
        let {
            chartType
        } = this.props;

        let {
            chartHeight
        } = this.state;

        console.log(this.props.verticalOrderBook);

        return !this.state.open 
            ? null
            :
            <BaseModal
                id={this.props.modalId}
                overlay={true}
                onClose={this.onClose.bind(this)}
                noHeaderContainer
                ref={this.props.modalId}
            >
                <section style={{paddingBottom: "1em"}} className="block-list no-border-bottom">
                    <header>
                        <Translate content="exchange.settings.chart_options" />
                    </header>
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-6">
                            <h6 style={{margin: 9}}>
                                <Translate content="exchange.settings.chart_type" />
                            </h6>
                        </div>
                        <div className="small-6">
                            <Select
                                placeholder={counterpart.translate("settings.placeholder_select")}
                                style={{width: "100%"}}
                                value={chartType}
                                onChange={this.props.onToggleChart.bind(this)}
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
                                <Select.Option value="">
                                    {counterpart.translate("exchange.settings.hidden_chart")}
                                </Select.Option>
                            </Select>
                        </div>
                    </div>

                    <div className="grid-block no-overflow wrap shrink" >
                        <div className="small-6">
                            <h6 style={{margin: 9}}>
                                <Translate content="exchange.settings.chart_height" />
                            </h6>
                        </div>
                        <div className="small-6">
                            <Slider 
                                min={300}
                                max={1000}
                                onChange={this.setChartHeight.bind(this)}
                                value={typeof chartHeight === "number" ? chartHeight : 300}
                            />
                        </div>
                    </div>

                    {chartType == "price_chart" ? 
                        <div className="grid-block no-overflow wrap shrink">
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.chart_tools" />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Switch 
                                    style={{margin: 6}}
                                    //  FIXME
                                />
                            </div>
                        </div> : null}

                    {chartType == "price_chart" ? 
                        <div className="grid-block no-overflow wrap shrink">
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.chart_zoom" />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Switch 
                                    style={{margin: 6}}
                                    //  FIXME
                                />
                            </div>
                        </div> : null}
                        
                    <header> 
                        Order Options 
                    </header>
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-6">
                            <h6 style={{margin: 9}}><Translate content="settings.orderbook_grouping" /></h6>
                        </div>
                        <div className="small-6">
                            <ul>
                                <li className="with-dropdown">
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
                                    
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-6">
                            <h6 style={{margin: 9}}>Style</h6>
                        </div>
                        <div className="small-6">
                            <Select 
                                placeholder={counterpart.translate("settings.placeholder_select")}
                                style={{width: "100%"}}
                                value={this.props.verticalOrderBook}
                                onSelect={this.props.onMoveOrderBook.bind(this)}
                            >
                                <Select.Option value={true}>
                                    Vertical
                                </Select.Option>
                                <Select.Option value={false}>
                                    Horizontal
                                </Select.Option>
                            </Select>
                        </div>
                    </div>

                    {/* FIXME */}
                    {!this.props.verticalOrderBook ? 
                        <div className="grid-block no-overflow wrap shrink" style={{ paddingTop: "0.5em" }}>
                            <div className="small-6">
                                <h6 style={{margin: 9}}> 
                                    Buy/Sell Orders
                                </h6>
                            </div>
                            <div className="small-6">
                                <Select 
                                    placeholder={counterpart.translate("settings.placeholder_select")}
                                    style={{width: "100%"}}
                                    // value={this.props.mirrorPanels}
                                    // onSelect={this.props.onMirrorPanels.bind(this)}
                                >
                                    <Select.Option value={false}>
                                        Buy - Sell
                                    </Select.Option>
                                    <Select.Option value={true}>
                                        Sell - Buy
                                    </Select.Option>
                                </Select>
                            </div>
                        </div> : null}

                    {/* FIXME */}
                    {!this.props.verticalOrderBook ? 
                        <div className="grid-block no-overflow wrap shrink" style={{ paddingTop: "0.5em" }}>
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    Buy/Sell Asset
                                </h6>
                            </div>
                            <div className="small-6">
                                <Select 
                                    placeholder={counterpart.translate("settings.placeholder_select")}
                                    style={{width: "100%"}}
                                    // value={this.props.mirrorPanels}
                                    // onSelect={this.props.onMirrorPanels.bind(this)}
                                >
                                    <Select.Option value={false}>
                                        Buy - Sell
                                    </Select.Option>
                                    <Select.Option value={true}>
                                        Sell - Buy
                                    </Select.Option>
                                </Select>
                            </div>
                        </div> : null}

                    {/* FIXME */}
                    {!this.props.verticalOrderBook ? 
                        <div className="grid-block no-overflow wrap shrink" style={{ paddingTop: "0.5em" }}>
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    Vertical Orders / Asset
                                </h6>
                            </div>
                            <div className="small-6">
                                <Select 
                                    placeholder={counterpart.translate("settings.placeholder_select")}
                                    style={{width: "100%"}}
                                    // value={this.props.mirrorPanels}
                                    // onSelect={this.props.onMirrorPanels.bind(this)}
                                >
                                    <Select.Option value={false}>
                                        Orders above Asset
                                    </Select.Option>
                                    <Select.Option value={true}>
                                        Asset above Order
                                    </Select.Option>
                                </Select>
                            </div>
                        </div> : null}

                    {this.props.verticalOrderBook ? 
                        <div className="grid-block no-overflow wrap shrink" style={{ paddingTop: "0.5em" }}>
                            <div className="small-6">
                                <h6 style={{margin: 9}}>
                                    <Translate content="exchange.settings.orderbook_autoscroll" />
                                </h6>
                            </div>
                            <div className="small-6">
                                <Switch 
                                    style={{margin: 6}}
                                    checked={this.state.autoScroll}
                                    onChange={this.setAutoscroll.bind(this)}
                                />
                            </div>
                        </div> : null}

                    <header>
                        Panel Grouping
                    </header>
                    <div className="grid-block no-overflow wrap shrink" style={{paddingBottom: "1em"}}>
                        <div className="small-6">
                            <h6 style={{margin: 9}}>My Trades</h6>
                        </div>
                        <div className="small-6">{this._getGroupingOptions("my_history")}</div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink" style={{paddingBottom: "1em"}}>
                        <div className="small-6">
                            <h6 style={{margin: 9}}>Market Trades</h6>
                        </div>
                        <div className="small-6">{this._getGroupingOptions("history")}</div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink" style={{paddingBottom: "1em"}}>
                        <div className="small-6">
                            <h6 style={{margin: 9}}>Open Orders</h6>
                        </div>
                        <div className="small-6">{this._getGroupingOptions("my_orders")}</div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink" style={{paddingBottom: "1em"}}>
                        <div className="small-6">
                            <h6 style={{margin: 9}}>Settlements</h6>
                        </div>
                        <div className="small-6">{this._getGroupingOptions("open_settlement")}</div>
                    </div>

                    <header>
                        General
                    </header>

                    <div className="grid-block no-overflow wrap shrink"  style={{paddingBottom: "0.5em"}}>
                        <div className="small-6" style={{paddingRight: 5}}>
                            <h6 style={{margin: 9}}>
                                <Translate content="exchange.settings.market_location" />
                            </h6>
                        </div>
                        <div className="small-6">
                            <Select 
                                placeholder={counterpart.translate("settings.placeholder_select")}
                                style={{width: "100%"}}
                                value={this.props.mirrorPanels}
                                onSelect={this.props.onMirrorPanels.bind(this)}
                            >
                                <Select.Option value={false}>
                                    <Translate content="settings.left" />
                                </Select.Option>
                                <Select.Option value={true}>
                                    <Translate content="settings.right" />
                                </Select.Option>
                            </Select>
                        </div>
                    </div>

                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-6" style={{paddingRight: 5}}>
                            <h6 style={{margin: 9}}>
                                <Translate content="exchange.settings.reduce_scrollbars" />
                            </h6>
                        </div>
                        <div className="small-6">
                            <Switch 
                                style={{margin: 6}}
                                checked={this.state.hideScrollbars}
                                onChange={this.props.onToggleScrollbars.bind(this)}
                            />
                        </div>
                    </div>

                    {/* FIXME */}
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-6" style={{paddingRight: 5}}>
                            <h6 style={{margin: 9}}>
                                <Translate content="exchange.settings.hide_function_buttons" />
                            </h6>
                        </div>
                        <div className="small-6">
                            <Switch 
                                style={{margin: 6}}
                                // checked={this.state.hideScrollbars}
                                // onChange={this.props.onToggleScrollbars.bind(this)}
                            />
                        </div>
                    </div>
                    
                </section>
                <Button 
                    type="primary"
                    onClick={this.onClose.bind(this)}
                >
                    <Translate content="global.close" />
                </Button>
            </BaseModal>
        ;
    }
}

export default Settings;