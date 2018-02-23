import React from "react";
import { findDOMNode } from "react-dom";
import utils from "common/utils";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import AltContainer from "alt-container";
import FormattedPrice from "./FormattedPrice";
import MarketsStore from "stores/MarketsStore";
import MarketStatsCheck from "./MarketStatsCheck";

class PulsingEquivalentPrice extends MarketStatsCheck {

    static propTypes = {
        toAsset: ChainTypes.ChainAsset.isRequired,
        fromAsset: ChainTypes.ChainAsset.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        toAsset: "1.3.0",
        coreAsset: "1.3.0",
        forceDirection: true
    }

    constructor(props) {
        super(props);

        this.state = {
            pulse: "",
            price: null
        };
    }

    shouldComponentUpdate(np, nextState) {
        return !utils.are_equal_shallow(nextState, this.state);
    }

    componentWillReceiveProps(nextProps) {
        if (!super.shouldComponentUpdate(nextProps)) return;

        this.update(nextProps);
    }

    componentWillMount() {
        this.update(this.props);
    }

    update (props) {
        let price = this.state.price;
        let nextPrice = this.getPrice(props);
        
        if (price === null || price === 1 || nextPrice === null || nextPrice === 1) {
            this.setState({ price: nextPrice, pulse: "" });
            return;
        }

        let priceVal = price.toReal();
        let nextPriceVal = nextPrice.toReal();

        if (priceVal === nextPriceVal) {
            this.setState({ price: nextPrice });
        } else {
            this.setState({ price: nextPrice, pulse: "" }, () => {
                findDOMNode(this).offsetHeight;
                this.setState({ pulse: nextPriceVal > priceVal ? "green" : "red" });
            });
        }
    }

    getPrice(props) {
        const { coreAsset, fromAsset, marketStats } = props;
        if (!marketStats) return null;
        if (coreAsset.get("id") === fromAsset.get("id")) return 1;
      
        let marketStat = marketStats.get(fromAsset.get("symbol") + "_" + coreAsset.get("symbol"));
        if (marketStat && marketStat.price) {
            return marketStat.price.clone();
        }

        return null;
    }

    getFinalPrice(real = false) {
        const { price } = this.state;
        return real ? price.toReal() : price;
    }

    render() {
        const { coreAsset, forceDirection, ...others} = this.props;
        const { price, pulse } = this.state;

        if (!price) return <span>--</span>;

        if (price === 1) {
            return <span>1.00</span>;
        }

        return (
            <span className={pulse ? `pulsate reverse fill-forward ${pulse}` : ""}>
                <FormattedPrice
                    force_direction={forceDirection ? coreAsset.get("symbol") : false}
                    base_amount={price.base.amount}
                    base_asset={price.base.asset_id}
                    quote_amount={price.quote.amount}
                    quote_asset={price.quote.asset_id}
                    {...others}
                />
            </span>
        );
    }
}

PulsingEquivalentPrice = BindToChainState(PulsingEquivalentPrice);

export default class PulsingEquivalentPriceWrapper extends React.Component {

    render() {
        return (
          <AltContainer
            stores={[MarketsStore]}
            inject={{
                marketStats: () => {
                    return MarketsStore.getState().allMarketStats;
                }
            }}
          >
            <PulsingEquivalentPrice
                {...this.props}
                ref={this.props.refCallback}
            />
          </AltContainer>
        );
    }
}
