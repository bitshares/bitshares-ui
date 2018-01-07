import React from "react";
import Translate from "react-translate-component";
import AssetName from "../Utility/AssetName";
import utils from "common/utils";
import cnames from "classnames";
import ReactTooltip from "react-tooltip";

export default class PriceStat extends React.Component {
    constructor() {
        super();
        this.state = {
            change: null
        };
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.volume2 && nextProps.volume2 !== this.props.volume2) {
            return true;
        }
        return (
            nextProps.price !== this.props.price ||
            nextProps.ready !== this.props.ready
        );
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.ready && this.props.ready) {
            this.setState({ change: parseFloat(nextProps.price) - parseFloat(this.props.price) });
        } else {
            this.setState({ change: 0 });
        }
    }

    componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    render() {
        let {base, quote, price, content, ready, volume, volume2, toolTip} = this.props;
        let {change} = this.state;
        let changeClass = null;
        if (change && change !== null) {
            changeClass = change > 0 ? "change-up" : "change-down";
        }

        let value = !volume ? utils.price_text(price, quote, base) :
            utils.format_volume(price);


        let value2 = volume2 ? utils.format_volume(volume2) :
            null;

        return (
            <li className={cnames("stressed-stat", this.props.className)} data-place="bottom" data-tip={toolTip}>
                <span>
                    <span className="value stat-primary">
                        {!ready ? 0 : value}&nbsp;
                    </span>
                    <span className="symbol-text"><AssetName name={base.get("symbol")} /></span>
                </span>
                {typeof volume2 === "number" ? <span>
                    <span></span>
                    <span className="value stat-primary">
                        {!ready ? 0 : <span> / {value2}</span>}&nbsp;
                    </span>
                    <span className="symbol-text"><AssetName name={quote.get("symbol")} /></span>
                 </span> : null}
                {content ? <div className="stat-text"><Translate content={content} /></div> : null}
            </li>
        );
    }
}
