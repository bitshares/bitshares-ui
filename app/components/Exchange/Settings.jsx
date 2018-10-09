import {
    Button, 
    Select, 
    Input
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

    setChartHeight() {
        this.props.onChangeChartHeight({value: this.state.chartHeight});
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
            showDepthChart
        } = this.props;

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
                        <Translate content="exchange.chart_type" />:
                    </header>
                    <Select
                        placeholder={counterpart.translate("settings.placeholder_select")}
                        style={{width: "100%"}}
                        value={
                            showDepthChart
                                ? "market_depth"
                                : "price_chart"
                        }
                        onChange={this.props.onToggleCharts.bind(this)}
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
                    </Select>
                    <header>
                        <Translate content="exchange.chart_height" />:
                    </header>
                    <Input
                        value={this.state.chartHeight}
                        size="small"
                        onChange={e =>
                            this.setState({
                                chartHeight: e.target.value
                            })
                        }
                        onPressEnter={
                            this.setChartHeight.bind(this)
                        }
                        addonAfter={
                            <Button
                                onClick={this.setChartHeight.bind(this)}
                                type="primary"
                                style={{
                                    padding: 0,
                                    margin: 0,
                                }}
                            >
                                <Translate content="global.set" />
                            </Button>
                        }
                    />
                    <Translate component="h5" content="settings.global_settings" />
                    
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
                    <div className="grid-block no-overflow wrap shrink" style={{paddingBottom: "1em"}}>
                        <div className="small-6" style={{paddingRight: 5}}>
                            <header>
                                <Translate content="exchange.panels_mirror" />
                            </header>
                            <Select 
                                placeholder={counterpart.translate("settings.placeholder_select")}
                                style={{width: "100%"}}
                                value={this.props.mirrorPanels ? 1 : 0}
                                onSelect={this.props.onMirrorPanels.bind(this)}
                            >
                                <Select.Option value={0}>
                                    <Translate content="settings.no" />
                                </Select.Option>
                                <Select.Option value={1}>
                                    <Translate content="settings.yes" />
                                </Select.Option>
                            </Select>
                        </div>
                        <div className="small-6">
                            <header>
                                <Translate content="exchange.chart_hide" />
                            </header>
                            <Select 
                                placeholder={counterpart.translate("settings.placeholder_select")}
                                style={{width: "100%"}}
                                value={this.props.hideChart ? 1 : 0}
                                onSelect={this.props.onToggleChart.bind(this)}
                            >
                                <Select.Option value={0}>
                                    <Translate content="settings.no" />
                                </Select.Option>
                                <Select.Option value={1}>
                                    <Translate content="settings.yes" />
                                </Select.Option>
                            </Select>
                        </div>
                    </div>

                    <div className="grid-block no-overflow wrap shrink" style={{paddingBottom: "1em"}}>
                        <div className="small-6" style={{paddingRight: 5}}>
                            <header>
                                <Translate content="settings.scrollbars_hide" />
                            </header>
                            <Select
                                placeholder={counterpart.translate("settings.placeholder_select")}
                                style={{width: "100%"}}
                                value={this.props.hideScrollbars ? 1 : 0}
                                onChange={this.props.onToggleScrollbars.bind(this)}
                            >
                                <Select.Option value={0}>
                                    <Translate content="settings.no" />
                                </Select.Option>
                                <Select.Option value={1}>
                                    <Translate content="settings.yes" />
                                </Select.Option>
                            </Select>
                        </div>
                        <div className="small-6">
                            {/* <header>
                                <Translate content="settings.orderbook_reverse" />
                            </header>
                            <Select 
                                placeholder={counterpart.translate("settings.placeholder_select")}
                                style={{width: "100%"}}
                                // value={this.state.autoScroll ? 1 : 0}
                                // onSelect={this.setAutoscroll.bind(this)}
                            >
                                <Select.Option value={0}>
                                    <Translate content="settings.no" />
                                </Select.Option>
                                <Select.Option value={1}>
                                    <Translate content="settings.yes" />
                                </Select.Option>
                            </Select> */}
                        </div>
                    </div>

                    <div className="grid-block no-overflow wrap shrink" style={{paddingBottom: "1em"}}>
                        <div className="small-6" style={{paddingRight: 5}}>
                            <header>
                                <Translate content="settings.orderbook_grouping" />
                            </header>
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
                        <div className="small-6">
                            <header>
                                <Translate content="settings.orderbook_autoscroll" />
                            </header>
                            <Select 
                                placeholder={counterpart.translate("settings.placeholder_select")}
                                style={{width: "100%"}}
                                value={this.state.autoScroll ? 1 : 0}
                                onSelect={this.setAutoscroll.bind(this)}
                            >
                                <Select.Option value={0}>
                                    <Translate content="settings.no" />
                                </Select.Option>
                                <Select.Option value={1}>
                                    <Translate content="settings.yes" />
                                </Select.Option>
                            </Select>
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