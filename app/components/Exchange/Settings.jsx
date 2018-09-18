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

    render() {
        let {
            exchangeLayout,
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
                        <Translate content="exchange.layout.title" />:
                    </header>
                    <Select 
                        placeholder={counterpart.translate("settings.placeholder_select")}
                        style={{width: "100%"}}
                        value={exchangeLayout ? exchangeLayout : "exchange.layout.1"}
                        onChange={this.props.onChangeLayout.bind(this)}
                    >
                        <Select.Option value="1">{counterpart.translate("exchange.layout.1")}</Select.Option>
                        <Select.Option value="2">{counterpart.translate("exchange.layout.2")}</Select.Option>
                        <Select.Option value="3">{counterpart.translate("exchange.layout.3")}</Select.Option>
                        <Select.Option value="4">{counterpart.translate("exchange.layout.4")}</Select.Option>
                        <Select.Option value="5">{counterpart.translate("exchange.layout.5")}</Select.Option>
                    </Select>
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