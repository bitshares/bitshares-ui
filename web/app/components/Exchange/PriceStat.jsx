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

    render() {
        let {base, quote, price, content, ready, volume, volume2} = this.props;
        let {change} = this.state;
        let changeClass = null;
        if (change && change !== null) {
            changeClass = change > 0 ? "change-up" : "change-down";
        }

        let value = !volume ? utils.price_text(price, quote, base) :
            utils.format_volume(price);


        let value2 = volume2 ? utils.format_volume(volume2) :
            null;

        let changeComp = !change ? null : change !== null ? <span className={changeClass}>&nbsp;{changeClass === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span> : null;

        return (
            <li className={cnames("stat", this.props.className)}>
                <span>
                    {content ? <span><Translate content={content} />:</span> : null}
                    <br/>
                    <b className="value stat-primary">
                        {!ready ? 0 : value}&nbsp;
                        {changeComp}
                    </b>
                    <span className="symbol-text"><AssetName name={base.get("symbol")} />{quote && !volume ? <span>/<AssetName name={quote.get("symbol")} /></span> : null}</span>
                </span>
                {typeof volume2 === "number" ? <span>
                    <b className="value stat-primary">
                        {!ready ? 0 : <span> / {volume2}</span>}&nbsp;
                        {changeComp}
                    </b>
                    <span className="symbol-text"><AssetName name={quote.get("symbol")} /></span>
                 </span> : null}
            </li>
        );
    }
}
