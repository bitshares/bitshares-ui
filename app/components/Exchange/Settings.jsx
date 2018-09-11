import {Button} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import BaseModal from "../Modal/BaseModal";

class Settings extends React.Component {
    constructor(props) {
        super();
        this.state = {
            open: false,
            smallScreen: false,
            chartHeight: props.chartHeight
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
        this.onClose();
    }

    render() {
        let {exchangeLayout, showDepthChart} = this.props;

        return !this.state.open ? null : (
            <BaseModal
                id={this.props.modalId}
                overlay={true}
                onClose={this.onClose.bind(this)}
                noHeaderContainer
                ref={this.props.modalId}
            >
                <section className="block-list no-border-bottom">
                    <header>
                        <Translate content="exchange.layout.title" />:
                    </header>
                    <ul>
                        <li className="with-dropdown">
                            <select
                                value={
                                    exchangeLayout
                                        ? exchangeLayout
                                        : "exchange.layout.1"
                                }
                                classNane="settings-select"
                                onChange={e => {
                                    this.props.onChangeLayout(e.target.value);
                                }}
                            >
                                <option value="1">
                                    {counterpart.translate("exchange.layout.1")}
                                </option>
                                <option value="2">
                                    {counterpart.translate("exchange.layout.2")}
                                </option>
                                <option value="3">
                                    {counterpart.translate("exchange.layout.3")}
                                </option>
                                {
                                    <option value="4">
                                        {counterpart.translate(
                                            "exchange.layout.4"
                                        )}
                                    </option>
                                }
                                {
                                    <option value="5">
                                        {counterpart.translate(
                                            "exchange.layout.5"
                                        )}
                                    </option>
                                }
                            </select>
                        </li>
                    </ul>
                    <header>
                        <Translate content="exchange.chart_type" />:
                    </header>
                    <ul>
                        <li className="with-dropdown">
                            <select
                                value={
                                    showDepthChart
                                        ? "depth_chart"
                                        : "price_chart"
                                }
                                className="settings-select"
                                onChange={e => {
                                    if (
                                        (showDepthChart &&
                                            e.target.value === "price_chart") ||
                                        (!showDepthChart &&
                                            e.target.value === "market_depth")
                                    ) {
                                        this.props.onToggleCharts();
                                    }
                                }}
                            >
                                <option value="market_depth">
                                    {counterpart.translate(
                                        "exchange.order_depth"
                                    )}
                                </option>
                                <option value="price_chart">
                                    {counterpart.translate(
                                        "exchange.price_history"
                                    )}
                                </option>
                            </select>
                        </li>
                    </ul>
                </section>
                <section className="block-list no-border-bottom">
                    <header>
                        <Translate content="exchange.chart_height" />:
                    </header>
                    <label>
                        <span className="inline-label">
                            <input
                                onKeyDown={e => {
                                    if (e.keyCode === 13) this.setChartHeight();
                                }}
                                type="number"
                                value={this.state.chartHeight}
                                onChange={e =>
                                    this.setState({
                                        chartHeight: e.target.value
                                    })
                                }
                            />
                            <div
                                className="button no-margin"
                                onClick={this.setChartHeight}
                            >
                                Set
                            </div>
                        </span>
                    </label>
                </section>
                <Button type="primary" onClick={this.onClose.bind(this)}>
                    <Translate content="global.close" />
                </Button>
            </BaseModal>
        );
    }
}

export default Settings;
