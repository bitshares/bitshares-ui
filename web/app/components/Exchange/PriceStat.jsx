import React from "react";
import Translate from "react-translate-component";
import AssetName from "../Utility/AssetName";
import utils from "common/utils";
import cnames from "classnames";

export default class PriceStat extends React.Component {

    constructor() {
        super();
        this.state = {
            change: null
        };
    }

    shouldComponentUpdate(nextProps) {
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

    render() {
        let {base, quote, price, content, ready, volume} = this.props;
        let {change} = this.state;
        let changeClass = null;
        if (change && change !== null) {
            changeClass = change > 0 ? "change-up" : "change-down";
        }

        let value = !volume ? utils.price_text(price, quote, base) :
            utils.format_volume(price);

        return (
            <li className={cnames("stat", this.props.className)}>
                <span>
                    {content ? <Translate content={content} /> : null}
                    <b className="value stat-primary">
                        {!ready ? 0 : value}&nbsp;
                        {!change ? null : change !== null ? <span className={changeClass}>&nbsp;{changeClass === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span> : null}
                    </b>
                    <span><AssetName name={base.get("symbol")} />{quote ? <span>/<AssetName name={quote.get("symbol")} /></span> : null}</span>
                </span>
            </li>
        );
    }
}
